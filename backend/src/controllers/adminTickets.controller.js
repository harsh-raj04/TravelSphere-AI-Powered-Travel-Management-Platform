const { prisma } = require("../lib/prisma");
const { notify } = require("../services/notificationService");

// ─── GET /admin/tickets ───────────────────────────────────────────────────────
async function listTickets(req, res) {
  try {
    const { status, priority, userRole, search } = req.query;

    const where = {};
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;
    if (userRole && userRole !== "all") where.userRole = userRole;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    });

    // Stats
    const [statusCounts, priorityCounts, roleCounts] = await Promise.all([
      prisma.supportTicket.groupBy({ by: ["status"], _count: true }),
      prisma.supportTicket.groupBy({ by: ["priority"], _count: true }),
      prisma.supportTicket.groupBy({ by: ["userRole"], _count: true }),
    ]);

    const stats = {
      open: 0, in_progress: 0, resolved: 0, closed: 0,
      urgent: 0, high: 0,
      byRole: {},
    };
    for (const r of statusCounts) stats[r.status] = r._count;
    for (const r of priorityCounts) {
      if (r.priority === "urgent") stats.urgent = r._count;
      if (r.priority === "high") stats.high = r._count;
    }
    for (const r of roleCounts) stats.byRole[r.userRole] = r._count;

    return res.json({ data: { tickets, stats } });
  } catch (err) {
    console.error("listTickets:", err);
    return res.status(500).json({ message: "Failed to fetch tickets" });
  }
}

// ─── GET /admin/tickets/stats ─────────────────────────────────────────────────
async function getTicketStats(req, res) {
  try {
    const [statusCounts, priorityCounts, roleCounts] = await Promise.all([
      prisma.supportTicket.groupBy({ by: ["status"], _count: true }),
      prisma.supportTicket.groupBy({ by: ["priority"], _count: true }),
      prisma.supportTicket.groupBy({ by: ["userRole"], _count: true }),
    ]);

    const stats = {
      open: 0, in_progress: 0, resolved: 0, closed: 0,
      urgent: 0, high: 0, medium: 0, low: 0,
      byRole: {},
    };
    for (const r of statusCounts) stats[r.status] = r._count;
    for (const r of priorityCounts) stats[r.priority] = r._count;
    for (const r of roleCounts) stats.byRole[r.userRole] = r._count;

    return res.json({ data: { stats } });
  } catch (err) {
    console.error("getTicketStats:", err);
    return res.status(500).json({ message: "Failed to fetch ticket stats" });
  }
}

// ─── GET /admin/tickets/:id ───────────────────────────────────────────────────
async function getTicket(req, res) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.json({ data: { ticket } });
  } catch (err) {
    console.error("getTicket:", err);
    return res.status(500).json({ message: "Failed to fetch ticket" });
  }
}

// ─── POST /admin/tickets/:id/messages ─────────────────────────────────────────
async function adminReply(req, res) {
  try {
    const { message, isInternal = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true } } },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user.id,
        senderRole: "admin",
        message: message.trim(),
        isInternal: Boolean(isInternal),
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Update ticket's updatedAt
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    // Notify the ticket creator (only for public replies)
    if (!isInternal && ticket.user) {
      try {
        await notify(ticket.user.id, {
          type: "ticket_reply",
          title: "Support reply received",
          message: `Admin has replied to your ticket ${ticket.ticketNumber}`,
          entityId: ticket.id,
          entityType: "ticket",
          actionUrl: "/agent/support",
          priority: "normal",
        });
      } catch (notifyErr) {
        console.error("[adminReply] notify failed:", notifyErr.message);
      }
    }

    return res.status(201).json({ data: { message: newMessage } });
  } catch (err) {
    console.error("adminReply:", err);
    return res.status(500).json({ message: "Failed to send reply" });
  }
}

// ─── PATCH /admin/tickets/:id ─────────────────────────────────────────────────
async function updateTicket(req, res) {
  try {
    const { status, priority, resolutionNotes } = req.body;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true } } },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const now = new Date();
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;

    if (status === "resolved" && ticket.status !== "resolved") {
      updateData.resolvedAt = now;
    }
    if (status === "closed" && ticket.status !== "closed") {
      updateData.closedAt = now;
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    });

    // Notify ticket creator on status change to resolved/closed
    if (status && ["resolved", "closed"].includes(status) && ticket.user) {
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      try {
        await notify(ticket.user.id, {
          type: "ticket_status_changed",
          title: `Ticket ${statusLabel}`,
          message: `Your support ticket ${ticket.ticketNumber} has been marked as ${status}.`,
          entityId: ticket.id,
          entityType: "ticket",
          actionUrl: "/agent/support",
          priority: "normal",
        });
      } catch (notifyErr) {
        console.error("[updateTicket] notify failed:", notifyErr.message);
      }
    }

    return res.json({ data: { ticket: updated } });
  } catch (err) {
    console.error("updateTicket:", err);
    return res.status(500).json({ message: "Failed to update ticket" });
  }
}

module.exports = { listTickets, getTicketStats, getTicket, adminReply, updateTicket };
