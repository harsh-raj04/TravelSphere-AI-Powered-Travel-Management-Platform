const { prisma } = require("../lib/prisma");

// ─── GET /agent/notifications ──────────────────────────────────────────────────
async function getMyNotifications(req, res) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      }),
    ]);

    return res.json({ data: { notifications, unreadCount } });
  } catch (err) {
    console.error("getMyNotifications:", err);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
}

// ─── PATCH /agent/notifications/:id/read ──────────────────────────────────────
async function markRead(req, res) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    return res.json({ data: { notification: updated } });
  } catch (err) {
    console.error("markRead:", err);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
}

// ─── PATCH /agent/notifications/mark-all-read ─────────────────────────────────
async function markAllRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    return res.json({ data: { success: true } });
  } catch (err) {
    console.error("markAllRead:", err);
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
}

// ─── GET /agent/notifications/unread-count ────────────────────────────────────
async function getUnreadCount(req, res) {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return res.json({ data: { count } });
  } catch (err) {
    console.error("getUnreadCount:", err);
    return res.status(500).json({ message: "Failed to fetch unread count" });
  }
}

module.exports = { getMyNotifications, markRead, markAllRead, getUnreadCount };
