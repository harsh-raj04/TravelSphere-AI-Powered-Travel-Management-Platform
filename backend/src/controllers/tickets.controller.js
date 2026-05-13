const { prisma } = require("../lib/prisma");
const { notify } = require("../services/notificationService");

/**
 * Auto-assign priority from keywords in subject + description.
 */
function inferPriority(subject, description) {
  const text = `${subject} ${description}`.toLowerCase();
  if (/urgent|critical/.test(text)) return "urgent";
  if (/payment failed|payment error|blocked|payment issue/.test(text)) return "high";
  if (/feature request|suggestion|general/.test(text)) return "low";
  return "medium";
}

/**
 * Generate a unique ticket number: TKT-YYYYMMDD-XXXX
 */
function generateTicketNumber() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `TKT-${date}-${rand}`;
}

// ─── POST /tickets ─────────────────────────────────────────────────────────────
async function createTicket(req, res) {
  try {
    const { subject, description, issueType } = req.body;

    if (!subject || !description || !issueType) {
      return res.status(400).json({ message: "subject, description, and issueType are required" });
    }

    const priority = inferPriority(subject, description);
    const ticketNumber = generateTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: req.user.id,
        userRole: req.user.role,
        subject: subject.trim(),
        description: description.trim(),
        issueType: issueType.trim(),
        priority,
        messages: {
          create: {
            senderId: req.user.id,
            senderRole: req.user.role,
            message: description.trim(),
          },
        },
      },
      include: {
        messages: {
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Notify the creator
    await notify(req.user.id, {
      type: "ticket_created",
      title: "Support ticket created",
      message: `Your ticket ${ticketNumber} has been received. We'll respond within 24 hours.`,
      entityId: ticket.id,
      entityType: "ticket",
      actionUrl: "/agent/support",
    });

    return res.status(201).json({ data: { ticket } });
  } catch (err) {
    console.error("createTicket:", err);
    return res.status(500).json({ message: "Failed to create ticket" });
  }
}

// ─── GET /tickets ──────────────────────────────────────────────────────────────
async function getMyTickets(req, res) {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return res.json({ data: { tickets } });
  } catch (err) {
    console.error("getMyTickets:", err);
    return res.status(500).json({ message: "Failed to fetch tickets" });
  }
}

// ─── GET /tickets/:id ─────────────────────────────────────────────────────────
async function getTicket(req, res) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          where: { isInternal: false }, // internal (admin-only) notes never sent to requester
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

    if (ticket.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ data: { ticket } });
  } catch (err) {
    console.error("getTicket:", err);
    return res.status(500).json({ message: "Failed to fetch ticket" });
  }
}

// ─── POST /tickets/:id/messages ───────────────────────────────────────────────
async function addMessage(req, res) {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({ message: "Cannot add messages to a closed ticket" });
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user.id,
        senderRole: req.user.role,
        message: message.trim(),
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

    return res.status(201).json({ data: { message: newMessage } });
  } catch (err) {
    console.error("addMessage:", err);
    return res.status(500).json({ message: "Failed to add message" });
  }
}

// ─── PATCH /tickets/:id/status ────────────────────────────────────────────────
async function updateMyTicketStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["resolved", "closed"].includes(status)) {
      return res.status(400).json({ message: "You can only set status to 'resolved' or 'closed'" });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const now = new Date();
    const updateData = { status };
    if (status === "resolved") updateData.resolvedAt = now;
    if (status === "closed") updateData.closedAt = now;

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    return res.json({ data: { ticket: updated } });
  } catch (err) {
    console.error("updateMyTicketStatus:", err);
    return res.status(500).json({ message: "Failed to update ticket status" });
  }
}

module.exports = { createTicket, getMyTickets, getTicket, addMessage, updateMyTicketStatus };
