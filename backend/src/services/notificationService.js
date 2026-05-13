const { prisma } = require("../lib/prisma");

/**
 * Create a notification for a user. Non-fatal — errors are logged but not thrown.
 */
async function notify(userId, { type, title, message, entityId, entityType, actionUrl, priority = "normal" }) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, entityId, entityType, actionUrl, priority },
    });
  } catch (err) {
    console.error("[notify] failed:", err.message);
  }
}

module.exports = { notify };
