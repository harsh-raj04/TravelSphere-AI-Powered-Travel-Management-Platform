const { prisma } = require("../lib/prisma");
const { notify } = require("../services/notificationService");

// ─── GET /admin/withdrawals ────────────────────────────────────────────────────
async function listWithdrawals(req, res) {
  try {
    const { status, search } = req.query;

    const where = {};
    if (status && status !== "all") where.status = status;

    const withdrawals = await prisma.agentWithdrawal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        agent: {
          select: {
            id: true,
            agencyName: true,
            user: { select: { name: true, email: true } },
          },
        },
        paymentMethod: {
          select: { type: true, bankName: true, accountNumber: true, upiId: true, cardLastFour: true },
        },
      },
    });

    // Optional search across agent name / txn ID
    const filtered = search
      ? withdrawals.filter((w) => {
          const q = search.toLowerCase();
          return (
            w.transactionId.toLowerCase().includes(q) ||
            w.agent?.user?.name?.toLowerCase().includes(q) ||
            w.agent?.agencyName?.toLowerCase().includes(q)
          );
        })
      : withdrawals;

    // Summary counts
    const allRows = await prisma.agentWithdrawal.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    });

    const summary = { pending: 0, processing: 0, completed: 0, failed: 0 };
    const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
    for (const row of allRows) {
      summary[row.status] = Number(row._sum.amount || 0);
      counts[row.status] = row._count;
    }

    return res.json({
      data: {
        withdrawals: filtered.map((w) => ({ ...w, amount: Number(w.amount) })),
        summary,
        counts,
      },
    });
  } catch (err) {
    console.error("listWithdrawals:", err);
    return res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
}

// ─── PATCH /admin/withdrawals/:id/approve ─────────────────────────────────────
async function approveWithdrawal(req, res) {
  try {
    const withdrawal = await prisma.agentWithdrawal.findUnique({
      where: { id: req.params.id },
    });

    if (!withdrawal)
      return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.status !== "pending")
      return res.status(400).json({ message: `Cannot approve a ${withdrawal.status} withdrawal` });

    const updated = await prisma.agentWithdrawal.update({
      where: { id: req.params.id },
      data: { status: "processing" },
    });

    // Notify the agent
    try {
      const agent = await prisma.agentProfile.findUnique({
        where: { id: withdrawal.agentId },
        include: { user: { select: { id: true } } },
      });
      if (agent) {
        await notify(agent.user.id, {
          type: "withdrawal_status",
          title: "Withdrawal Approved",
          message: `Your withdrawal of ₹${Number(withdrawal.amount).toLocaleString("en-IN")} (${withdrawal.transactionId}) has been approved and is now being processed.`,
          entityId: withdrawal.id,
          entityType: "withdrawal",
          actionUrl: "/agent/payments",
          priority: "high",
        });
      }
    } catch (notifyErr) {
      console.error("[approveWithdrawal] notify failed:", notifyErr.message);
    }

    return res.json({ data: { withdrawal: { ...updated, amount: Number(updated.amount) } } });
  } catch (err) {
    console.error("approveWithdrawal:", err);
    return res.status(500).json({ message: "Failed to approve withdrawal" });
  }
}

// ─── PATCH /admin/withdrawals/:id/complete ────────────────────────────────────
async function completeWithdrawal(req, res) {
  try {
    const withdrawal = await prisma.agentWithdrawal.findUnique({
      where: { id: req.params.id },
    });

    if (!withdrawal)
      return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.status !== "processing")
      return res.status(400).json({ message: `Cannot complete a ${withdrawal.status} withdrawal` });

    const { reference } = req.body;

    const updated = await prisma.agentWithdrawal.update({
      where: { id: req.params.id },
      data: {
        status: "completed",
        processedAt: new Date(),
        // store bank reference in failureReason column reused as notes, or add a proper field
        ...(reference ? { failureReason: null } : {}),
      },
    });

    // Notify the agent
    try {
      const agent = await prisma.agentProfile.findUnique({
        where: { id: withdrawal.agentId },
        include: { user: { select: { id: true } } },
      });
      if (agent) {
        await notify(agent.user.id, {
          type: "withdrawal_status",
          title: "Withdrawal Completed",
          message: `Your withdrawal of ₹${Number(withdrawal.amount).toLocaleString("en-IN")} has been completed and transferred to your account.`,
          entityId: withdrawal.id,
          entityType: "withdrawal",
          actionUrl: "/agent/payments",
          priority: "high",
        });
      }
    } catch (notifyErr) {
      console.error("[completeWithdrawal] notify failed:", notifyErr.message);
    }

    return res.json({ data: { withdrawal: { ...updated, amount: Number(updated.amount) } } });
  } catch (err) {
    console.error("completeWithdrawal:", err);
    return res.status(500).json({ message: "Failed to complete withdrawal" });
  }
}

// ─── PATCH /admin/withdrawals/:id/fail ────────────────────────────────────────
async function failWithdrawal(req, res) {
  try {
    const withdrawal = await prisma.agentWithdrawal.findUnique({
      where: { id: req.params.id },
    });

    if (!withdrawal)
      return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.status === "completed" || withdrawal.status === "failed")
      return res.status(400).json({ message: `Cannot fail a ${withdrawal.status} withdrawal` });

    const { reason } = req.body;

    const updated = await prisma.agentWithdrawal.update({
      where: { id: req.params.id },
      data: {
        status: "failed",
        failureReason: reason || "Marked as failed by admin",
        processedAt: new Date(),
      },
    });

    // Notify the agent
    try {
      const agent = await prisma.agentProfile.findUnique({
        where: { id: withdrawal.agentId },
        include: { user: { select: { id: true } } },
      });
      if (agent) {
        await notify(agent.user.id, {
          type: "withdrawal_status",
          title: "Withdrawal Failed",
          message: `Your withdrawal of ₹${Number(withdrawal.amount).toLocaleString("en-IN")} could not be processed. Reason: ${reason || "Marked as failed by admin"}. The amount has been returned to your available balance.`,
          entityId: withdrawal.id,
          entityType: "withdrawal",
          actionUrl: "/agent/payments",
          priority: "high",
        });
      }
    } catch (notifyErr) {
      console.error("[failWithdrawal] notify failed:", notifyErr.message);
    }

    return res.json({ data: { withdrawal: { ...updated, amount: Number(updated.amount) } } });
  } catch (err) {
    console.error("failWithdrawal:", err);
    return res.status(500).json({ message: "Failed to update withdrawal status" });
  }
}

module.exports = { listWithdrawals, approveWithdrawal, completeWithdrawal, failWithdrawal };
