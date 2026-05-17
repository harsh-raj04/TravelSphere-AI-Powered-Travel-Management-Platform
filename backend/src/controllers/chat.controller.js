const { PrismaClient } = require('@prisma/client');
const { getIO, formatMessage, adminDeleteMessage } = require('../socket');

const prisma = new PrismaClient();

// Default system rooms seeded on startup
const SYSTEM_ROOMS = [
  { slug: 'public', name: 'TravelSphere Community', type: 'public', description: 'A place for all travelers to connect, share tips, and plan adventures together.', image: null },
  { slug: 'manali', name: 'Manali Chat', type: 'location', location: 'Manali', description: 'Discuss treks, stays, snow adventures, and everything Manali!', image: null },
  { slug: 'shimla', name: 'Shimla Chat', type: 'location', location: 'Shimla', description: 'Heritage trails, Mall Road gossip, and hill station vibes.', image: null },
  { slug: 'goa', name: 'Goa Chat', type: 'location', location: 'Goa', description: 'Beaches, feni, nightlife, and hidden gems of Goa.', image: null },
  { slug: 'kerala', name: 'Kerala Chat', type: 'location', location: 'Kerala', description: 'Backwaters, ayurveda, and God\'s Own Country travel tips.', image: null },
  { slug: 'rajasthan', name: 'Rajasthan Chat', type: 'location', location: 'Rajasthan', description: 'Royal palaces, desert safaris, and colorful forts.', image: null },
  { slug: 'kashmir', name: 'Kashmir Chat', type: 'location', location: 'Kashmir', description: 'Dal Lake, Gulmarg skiing, and paradise on earth.', image: null },
  { slug: 'ladakh', name: 'Ladakh Chat', type: 'location', location: 'Ladakh', description: 'Road trips, monasteries, and the land of high passes.', image: null },
  { slug: 'northeast', name: 'Northeast Chat', type: 'location', location: 'Northeast India', description: 'Meghalaya, Sikkim, and the undiscovered northeastern states.', image: null },
  { slug: 'uttarakhand', name: 'Uttarakhand Chat', type: 'location', location: 'Uttarakhand', description: 'Char Dham, adventure sports, and spiritual escapes.', image: null },
];

async function seedSystemRooms() {
  for (const room of SYSTEM_ROOMS) {
    await prisma.chatRoom.upsert({
      where: { slug: room.slug },
      update: {},
      create: { ...room, isPublic: true, isActive: true },
    });
  }
}

// Call once on startup
seedSystemRooms().catch(console.error);

// ── Profile ──────────────────────────────────────────────────────────────────

async function getMyProfile(req, res) {
  try {
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    res.json({ success: true, data: profile });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function createProfile(req, res) {
  try {
    const { displayName, avatar, bio } = req.body;
    if (!displayName?.trim()) return res.status(400).json({ success: false, message: 'Display name is required' });
    if (displayName.length < 3 || displayName.length > 20) return res.status(400).json({ success: false, message: 'Display name must be 3-20 characters' });
    if (!/^[a-zA-Z0-9_ ]+$/.test(displayName)) return res.status(400).json({ success: false, message: 'Display name can only contain letters, numbers, spaces, and underscores' });

    const existing = await prisma.userChatProfile.findUnique({ where: { displayName: displayName.trim() } });
    if (existing && existing.userId !== req.user.id) return res.status(409).json({ success: false, message: 'Display name already taken' });

    const profile = await prisma.userChatProfile.upsert({
      where: { userId: req.user.id },
      update: { displayName: displayName.trim(), avatar, bio },
      create: { userId: req.user.id, displayName: displayName.trim(), avatar, bio },
    });
    res.json({ success: true, data: profile });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ success: false, message: 'Display name already taken' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function updateProfile(req, res) {
  try {
    const { bio, allowPrivateMessages, showOnlineStatus, notificationPrefs, status } = req.body;
    const profile = await prisma.userChatProfile.update({
      where: { userId: req.user.id },
      data: { bio, allowPrivateMessages, showOnlineStatus, notificationPrefs, status },
    });
    res.json({ success: true, data: profile });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

async function getRooms(req, res) {
  try {
    const rooms = await prisma.chatRoom.findMany({
      where: { isActive: true, isPublic: true, type: { in: ['public', 'location'] } },
      select: { id: true, type: true, name: true, slug: true, description: true, image: true, location: true, messageCount: true, lastActivityAt: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: rooms });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getRoomBySlug(req, res) {
  try {
    const { slug } = req.params;
    const room = await prisma.chatRoom.findUnique({ where: { slug } });
    if (!room || !room.isActive) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getMyGroups(req, res) {
  try {
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.json({ success: true, data: [] });
    const memberships = await prisma.chatRoomMember.findMany({
      where: { profileId: profile.id, isBanned: false },
      include: { room: { select: { id: true, type: true, name: true, slug: true, description: true, image: true, messageCount: true, lastActivityAt: true, isPublic: true, createdAt: true } } },
    });
    const rooms = memberships.filter(m => ['group', 'private'].includes(m.room.type)).map(m => ({ ...m.room, role: m.role, joinedAt: m.joinedAt, lastReadAt: m.lastReadAt }));
    res.json({ success: true, data: rooms });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function createGroup(req, res) {
  try {
    const { name, description, isPublic = true } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Group name is required' });

    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ success: false, message: 'Create a chat profile first' });

    const slug = `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const room = await prisma.chatRoom.create({
      data: { type: 'group', name: name.trim(), slug, description, isPublic, createdById: req.user.id },
    });
    await prisma.chatRoomMember.create({ data: { roomId: room.id, profileId: profile.id, role: 'admin' } });
    res.json({ success: true, data: room });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function joinRoom(req, res) {
  try {
    const { roomId } = req.params;
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ success: false, message: 'Create a chat profile first' });

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) return res.status(404).json({ success: false, message: 'Room not found' });

    await prisma.chatRoomMember.upsert({
      where: { roomId_profileId: { roomId, profileId: profile.id } },
      update: {},
      create: { roomId, profileId: profile.id },
    });
    res.json({ success: true, data: { roomId, profileId: profile.id } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function inviteToGroup(req, res) {
  try {
    const { roomId } = req.params;
    const { targetProfileId } = req.body;

    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    const membership = await prisma.chatRoomMember.findUnique({ where: { roomId_profileId: { roomId, profileId: profile.id } } });
    if (!membership || !['admin', 'moderator'].includes(membership.role)) return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.chatRoomMember.upsert({
      where: { roomId_profileId: { roomId, profileId: targetProfileId } },
      update: {},
      create: { roomId, profileId: targetProfileId },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── Messages ──────────────────────────────────────────────────────────────────

async function getMessages(req, res) {
  try {
    const { roomId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: { replyTo: { select: { id: true, content: true, senderName: true, isDeleted: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    res.json({ success: true, data: messages.reverse().map(formatMessage) });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    if (msg.senderId !== profile?.id) return res.status(403).json({ success: false, message: 'Not your message' });

    await prisma.chatMessage.update({ where: { id: messageId }, data: { isDeleted: true, deletedAt: new Date(), content: '[Message deleted]' } });
    const io = getIO();
    if (io) io.to(msg.roomId).emit('message-deleted', { messageId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function flagMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ success: false, message: 'Chat profile required' });

    const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    const flaggedBy = Array.isArray(msg.flaggedBy) ? [...msg.flaggedBy] : [];
    if (!flaggedBy.some(f => f.userId === profile.id)) {
      flaggedBy.push({ userId: profile.id, reason: reason || 'inappropriate', timestamp: new Date().toISOString() });
      await prisma.chatMessage.update({ where: { id: messageId }, data: { isFlagged: true, flaggedBy } });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── Private Messaging ─────────────────────────────────────────────────────────

async function getPrivateConversations(req, res) {
  try {
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.json({ success: true, data: [] });

    const memberships = await prisma.chatRoomMember.findMany({
      where: { profileId: profile.id, room: { type: 'private' } },
      include: {
        room: {
          include: {
            members: { include: { profile: { select: { id: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } } } },
            messages: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    const conversations = memberships.map(m => {
      const other = m.room.members.find(mem => mem.profileId !== profile.id);
      const lastMsg = m.room.messages[0];
      return {
        roomId: m.room.id,
        other: other?.profile || null,
        lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null,
        lastReadAt: m.lastReadAt,
        lastActivityAt: m.room.lastActivityAt,
      };
    });

    res.json({ success: true, data: conversations.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt)) });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function startPrivateChat(req, res) {
  try {
    const { targetProfileId } = req.body;
    const myProfile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!myProfile) return res.status(403).json({ success: false, message: 'Create a chat profile first' });
    if (myProfile.id === targetProfileId) return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });

    const targetProfile = await prisma.userChatProfile.findUnique({ where: { id: targetProfileId } });
    if (!targetProfile) return res.status(404).json({ success: false, message: 'User not found' });
    if (!targetProfile.allowPrivateMessages) return res.status(403).json({ success: false, message: 'This user has disabled private messages' });
    if (myProfile.blockedUserIds.includes(targetProfileId) || targetProfile.blockedUserIds.includes(myProfile.id)) {
      return res.status(403).json({ success: false, message: 'Cannot send message to this user' });
    }

    // Check for existing private room between these two
    const existing = await prisma.chatRoom.findFirst({
      where: {
        type: 'private',
        members: { some: { profileId: myProfile.id } },
        AND: [{ members: { some: { profileId: targetProfileId } } }],
      },
    });
    if (existing) return res.json({ success: true, data: existing });

    const slug = `private-${[myProfile.id, targetProfileId].sort().join('-')}`;
    const room = await prisma.chatRoom.create({
      data: {
        type: 'private', name: `${myProfile.displayName} & ${targetProfile.displayName}`,
        slug, isPublic: false,
        members: { create: [{ profileId: myProfile.id }, { profileId: targetProfileId }] },
      },
    });
    res.json({ success: true, data: room });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── Block / Unblock ───────────────────────────────────────────────────────────

async function blockUser(req, res) {
  try {
    const { targetProfileId } = req.params;
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ success: false, message: 'Chat profile required' });
    const blocked = [...new Set([...profile.blockedUserIds, targetProfileId])];
    await prisma.userChatProfile.update({ where: { id: profile.id }, data: { blockedUserIds: blocked } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function unblockUser(req, res) {
  try {
    const { targetProfileId } = req.params;
    const profile = await prisma.userChatProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ success: false, message: 'Chat profile required' });
    const blocked = profile.blockedUserIds.filter(id => id !== targetProfileId);
    await prisma.userChatProfile.update({ where: { id: profile.id }, data: { blockedUserIds: blocked } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── Online Users ──────────────────────────────────────────────────────────────

async function getOnlineUsers(req, res) {
  try {
    const { roomId } = req.params;
    const users = await prisma.userChatProfile.findMany({
      where: { isOnline: true, memberships: { some: { roomId } } },
      select: { id: true, displayName: true, avatar: true, status: true, lastSeen: true },
      take: 100,
    });
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ── Admin Moderation ──────────────────────────────────────────────────────────

async function adminGetStats(req, res) {
  try {
    const [totalMessages, flaggedMessages, totalProfiles, bannedUsers, totalRooms] = await Promise.all([
      prisma.chatMessage.count({ where: { isDeleted: false } }),
      prisma.chatMessage.count({ where: { isFlagged: true, isDeleted: false } }),
      prisma.userChatProfile.count(),
      prisma.userChatProfile.count({ where: { isBanned: true } }),
      prisma.chatRoom.count({ where: { isActive: true } }),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const messagesToday = await prisma.chatMessage.count({ where: { createdAt: { gte: today } } });
    res.json({ success: true, data: { totalMessages, messagesToday, flaggedMessages, totalProfiles, bannedUsers, totalRooms } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminGetFlaggedMessages(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const messages = await prisma.chatMessage.findMany({
      where: { isFlagged: true, isDeleted: false },
      include: { room: { select: { name: true, slug: true } }, sender: { select: { displayName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.chatMessage.count({ where: { isFlagged: true, isDeleted: false } });
    res.json({ success: true, data: { messages, total, page, pages: Math.ceil(total / limit) } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminDeleteMessageRest(req, res) {
  try {
    const { messageId } = req.params;
    const msg = await adminDeleteMessage(messageId);
    const io = getIO();
    if (io) io.to(msg.roomId).emit('message-deleted', { messageId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminBanUserFromChat(req, res) {
  try {
    const { profileId } = req.params;
    const { reason, expiresAt } = req.body; // expiresAt = null means permanent
    await prisma.userChatProfile.update({
      where: { id: profileId },
      data: { isBanned: true, banReason: reason || 'Violation of community guidelines', banExpiresAt: expiresAt ? new Date(expiresAt) : null },
    });
    const io = getIO();
    if (io) io.emit('user-banned', { profileId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminUnbanUser(req, res) {
  try {
    const { profileId } = req.params;
    await prisma.userChatProfile.update({ where: { id: profileId }, data: { isBanned: false, banReason: null, banExpiresAt: null } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminGetUsers(req, res) {
  try {
    const { search, banned, page = 1 } = req.query;
    const limit = 20;
    const where = {};
    if (search) where.displayName = { contains: search, mode: 'insensitive' };
    if (banned === 'true') where.isBanned = true;
    const [profiles, total] = await Promise.all([
      prisma.userChatProfile.findMany({ where, orderBy: { messagesSent: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.userChatProfile.count({ where }),
    ]);
    res.json({ success: true, data: { profiles, total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminWarnUser(req, res) {
  try {
    const { profileId } = req.params;
    const { reason } = req.body;
    const profile = await prisma.userChatProfile.findUnique({ where: { id: profileId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    const warnings = Array.isArray(profile.warnings) ? [...profile.warnings] : [];
    warnings.push({ reason: reason || 'Community guidelines violation', issuedAt: new Date().toISOString() });
    await prisma.userChatProfile.update({ where: { id: profileId }, data: { warnings } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminGetRoomMessages(req, res) {
  try {
    const { roomId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const messages = await prisma.chatMessage.findMany({
      where: { roomId, isDeleted: false },
      include: { sender: { select: { displayName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50, skip: (page - 1) * 50,
    });
    res.json({ success: true, data: messages.reverse() });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminDismissFlag(req, res) {
  try {
    const { messageId } = req.params;
    await prisma.chatMessage.update({ where: { id: messageId }, data: { isFlagged: false, flaggedBy: [] } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminDisbandGroup(req, res) {
  try {
    const { roomId } = req.params;
    await prisma.chatRoom.update({ where: { id: roomId }, data: { isActive: false } });
    const io = getIO();
    if (io) io.to(roomId).emit('room-disbanded', { roomId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function adminGetGroups(req, res) {
  try {
    const groups = await prisma.chatRoom.findMany({
      where: { type: 'group', isActive: true },
      include: { _count: { select: { members: true, messages: true } } },
      orderBy: { lastActivityAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: groups });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  getMyProfile, createProfile, updateProfile,
  getRooms, getRoomBySlug, getMyGroups, createGroup, joinRoom, inviteToGroup,
  getMessages, deleteMessage, flagMessage,
  getPrivateConversations, startPrivateChat,
  blockUser, unblockUser, getOnlineUsers,
  adminGetStats, adminGetFlaggedMessages, adminDeleteMessageRest, adminBanUserFromChat,
  adminUnbanUser, adminGetUsers, adminWarnUser, adminGetRoomMessages, adminDismissFlag,
  adminDisbandGroup, adminGetGroups,
};
