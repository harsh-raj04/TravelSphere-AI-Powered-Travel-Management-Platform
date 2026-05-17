const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// In-memory online tracking: socketId -> { userId, profileId, displayName, roomIds }
const onlineUsers = new Map();
// roomId -> Set of profileIds
const roomOnline = new Map();

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5100',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const profile = await prisma.userChatProfile.findUnique({ where: { userId: payload.id } });
      if (!profile) return next(new Error('No chat profile found'));
      if (profile.isBanned) {
        const expired = profile.banExpiresAt && profile.banExpiresAt < new Date();
        if (!expired) return next(new Error('You are banned from community chat'));
        await prisma.userChatProfile.update({ where: { id: profile.id }, data: { isBanned: false, banReason: null, banExpiresAt: null } });
      }
      socket.userId = payload.id;
      socket.profileId = profile.id;
      socket.displayName = profile.displayName;
      socket.avatar = profile.avatar;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId, profileId, displayName } = socket;

    // Mark online
    onlineUsers.set(socket.id, { userId, profileId, displayName, avatar: socket.avatar, roomIds: new Set() });
    await prisma.userChatProfile.update({ where: { id: profileId }, data: { isOnline: true, lastSeen: new Date() } });

    // ── Join Room ────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId }) => {
      try {
        const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
        if (!room || !room.isActive) return socket.emit('error', { message: 'Room not found' });

        socket.join(roomId);
        const userData = onlineUsers.get(socket.id);
        if (userData) userData.roomIds.add(roomId);

        if (!roomOnline.has(roomId)) roomOnline.set(roomId, new Set());
        roomOnline.get(roomId).add(profileId);

        // Upsert membership
        await prisma.chatRoomMember.upsert({
          where: { roomId_profileId: { roomId, profileId } },
          update: { lastReadAt: new Date() },
          create: { roomId, profileId },
        });

        io.to(roomId).emit('user-joined', { profileId, displayName, avatar: socket.avatar });
        socket.emit('online-users', getOnlineForRoom(roomId));
      } catch (e) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ── Leave Room ───────────────────────────────────────────────────
    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      const userData = onlineUsers.get(socket.id);
      if (userData) userData.roomIds.delete(roomId);
      roomOnline.get(roomId)?.delete(profileId);
      io.to(roomId).emit('user-left', { profileId, displayName });
    });

    // ── Send Message ─────────────────────────────────────────────────
    socket.on('send-message', async ({ roomId, content, replyToId, messageType = 'text' }) => {
      try {
        if (!content?.trim() || content.length > 2000) return;
        const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
        if (!room) return;

        // Check member ban
        const membership = await prisma.chatRoomMember.findUnique({ where: { roomId_profileId: { roomId, profileId } } });
        if (membership?.isBanned) {
          const expired = membership.banExpiresAt && membership.banExpiresAt < new Date();
          if (!expired) return socket.emit('error', { message: 'You are banned from this room' });
        }

        // Mention extraction: @displayName
        const mentionPattern = /@(\w[\w\s]*)/g;
        const mentionedNames = [...content.matchAll(mentionPattern)].map(m => m[1].trim());
        const mentionedProfiles = mentionedNames.length
          ? await prisma.userChatProfile.findMany({ where: { displayName: { in: mentionedNames } }, select: { id: true } })
          : [];
        const mentions = mentionedProfiles.map(p => p.id);

        const msg = await prisma.chatMessage.create({
          data: {
            roomId,
            senderId: profileId,
            userId,
            senderName: displayName,
            senderAvatar: socket.avatar,
            messageType,
            content: content.trim(),
            replyToId: replyToId || null,
            mentions,
          },
          include: { replyTo: { select: { id: true, content: true, senderName: true } } },
        });

        await prisma.chatRoom.update({ where: { id: roomId }, data: { lastActivityAt: new Date(), messageCount: { increment: 1 } } });
        await prisma.userChatProfile.update({ where: { id: profileId }, data: { messagesSent: { increment: 1 } } });

        io.to(roomId).emit('message-received', formatMessage(msg));
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Typing ───────────────────────────────────────────────────────
    socket.on('typing-start', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', { profileId, displayName, typing: true });
    });
    socket.on('typing-stop', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', { profileId, displayName, typing: false });
    });

    // ── Reactions ────────────────────────────────────────────────────
    socket.on('add-reaction', async ({ messageId, emoji }) => {
      try {
        const ALLOWED = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
        if (!ALLOWED.includes(emoji)) return;
        const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (!msg) return;

        let reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
        const existingIdx = reactions.findIndex(r => r.emoji === emoji && r.userId === profileId);
        if (existingIdx >= 0) {
          reactions.splice(existingIdx, 1);
        } else {
          reactions.push({ emoji, userId: profileId, timestamp: new Date().toISOString() });
        }

        const updated = await prisma.chatMessage.update({ where: { id: messageId }, data: { reactions } });
        io.to(msg.roomId).emit('reaction-updated', { messageId, reactions: updated.reactions });
      } catch {}
    });

    // ── Flag Message ─────────────────────────────────────────────────
    socket.on('flag-message', async ({ messageId, reason }) => {
      try {
        const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (!msg) return;
        const flaggedBy = Array.isArray(msg.flaggedBy) ? [...msg.flaggedBy] : [];
        const already = flaggedBy.some(f => f.userId === profileId);
        if (!already) {
          flaggedBy.push({ userId: profileId, reason: reason || 'inappropriate', timestamp: new Date().toISOString() });
          await prisma.chatMessage.update({ where: { id: messageId }, data: { isFlagged: true, flaggedBy } });
        }
        socket.emit('flag-success', { messageId });
      } catch {}
    });

    // ── Delete Message ───────────────────────────────────────────────
    socket.on('delete-message', async ({ messageId }) => {
      try {
        const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (!msg || msg.senderId !== profileId) return;
        // Only allow delete within 5 minutes
        const age = Date.now() - new Date(msg.createdAt).getTime();
        if (age > 5 * 60 * 1000) return socket.emit('error', { message: 'Cannot delete messages older than 5 minutes' });

        await prisma.chatMessage.update({ where: { id: messageId }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: profileId, content: '[Message deleted]' } });
        io.to(msg.roomId).emit('message-deleted', { messageId });
      } catch {}
    });

    // ── Message Read ─────────────────────────────────────────────────
    socket.on('message-read', async ({ roomId }) => {
      try {
        await prisma.chatRoomMember.updateMany({ where: { roomId, profileId }, data: { lastReadAt: new Date() } });
      } catch {}
    });

    // ── Disconnect ───────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const userData = onlineUsers.get(socket.id);
      if (userData) {
        userData.roomIds.forEach(roomId => {
          roomOnline.get(roomId)?.delete(profileId);
          io.to(roomId).emit('user-left', { profileId, displayName });
        });
        onlineUsers.delete(socket.id);
      }
      await prisma.userChatProfile.update({ where: { id: profileId }, data: { isOnline: false, lastSeen: new Date() } }).catch(() => {});
    });
  });

  return io;
}

function getOnlineForRoom(roomId) {
  const set = roomOnline.get(roomId) || new Set();
  const result = [];
  onlineUsers.forEach((data) => {
    if (set.has(data.profileId)) {
      result.push({ profileId: data.profileId, displayName: data.displayName, avatar: data.avatar });
    }
  });
  return result;
}

function formatMessage(msg) {
  return {
    id: msg.id,
    roomId: msg.roomId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderAvatar: msg.senderAvatar,
    messageType: msg.messageType,
    content: msg.isDeleted ? '[Message deleted]' : msg.content,
    replyTo: msg.replyTo || null,
    mentions: msg.mentions,
    reactions: msg.reactions,
    attachments: msg.attachments,
    isDeleted: msg.isDeleted,
    isEdited: msg.isEdited,
    isFlagged: msg.isFlagged,
    isPinned: msg.isPinned,
    createdAt: msg.createdAt,
  };
}

function getIO() { return io; }
function adminDeleteMessage(messageId) {
  return prisma.chatMessage.update({ where: { id: messageId }, data: { isDeleted: true, deletedAt: new Date(), content: '[Removed by moderator]' } });
}
function adminBanUser(profileId, roomId, data) {
  if (io) io.to(roomId).emit('user-banned', { profileId });
  return prisma.chatRoomMember.updateMany({ where: { profileId, roomId }, data });
}

module.exports = { initSocket, getIO, formatMessage, adminDeleteMessage, adminBanUser };
