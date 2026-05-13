const { prisma } = require("../lib/prisma");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateTxnId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TSWD-${date}-${rand}`;
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function buildMethodSnapshot(method) {
  if (method.type === "bank_account") {
    return {
      type: method.type,
      label: method.bankName ? `${method.bankName} Bank` : "Bank Account",
      detail: method.accountNumber
        ? `•••• ${method.accountNumber}`
        : "Bank Account",
    };
  }
  if (method.type === "upi") {
    return { type: method.type, label: "UPI", detail: method.upiId || "UPI Account" };
  }
  return {
    type: method.type,
    label: "Card",
    detail: method.cardLastFour
      ? `•••• •••• •••• ${method.cardLastFour}`
      : "Card",
  };
}

async function resolveAgentProfile(userId) {
  return prisma.agentProfile.findUnique({ where: { userId } });
}

async function computeSummary(agentProfileId) {
  // Total earned from completed bookings
  const earningsAgg = await prisma.booking.aggregate({
    where: {
      assignedAgentId: agentProfileId,
      status: "completed",
      agentPayout: { not: null },
    },
    _sum: { agentPayout: true },
    _count: true,
  });
  const totalEarned = Number(earningsAgg._sum.agentPayout || 0);

  // Withdrawal sums grouped by status
  const wdRows = await prisma.agentWithdrawal.groupBy({
    by: ["status"],
    where: { agentId: agentProfileId },
    _sum: { amount: true },
  });

  let totalWithdrawn = 0;
  let totalProcessing = 0;
  let totalPending = 0;

  for (const row of wdRows) {
    const amt = Number(row._sum.amount || 0);
    if (row.status === "completed") totalWithdrawn += amt;
    else if (row.status === "processing") totalProcessing += amt;
    else if (row.status === "pending") totalPending += amt;
  }

  const availableBalance = Math.max(
    0,
    totalEarned - totalWithdrawn - totalProcessing - totalPending
  );

  return {
    totalEarned,
    totalWithdrawn,
    totalProcessing,
    totalPending,
    availableBalance,
    completedBookingsCount: earningsAgg._count,
  };
}

// ─── GET /agent/earnings/summary ──────────────────────────────────────────────
async function getEarningsSummary(req, res) {
  try {
    const agentProfile = await resolveAgentProfile(req.user.id);
    if (!agentProfile)
      return res.status(404).json({ message: "Agent profile not found" });

    const summary = await computeSummary(agentProfile.id);
    return res.json({ data: summary });
  } catch (err) {
    console.error("getEarningsSummary:", err);
    return res.status(500).json({ message: "Failed to fetch earnings summary" });
  }
}

// ─── GET /agent/earnings/withdrawals ─────────────────────────────────────────
async function getWithdrawalHistory(req, res) {
  try {
    const agentProfile = await resolveAgentProfile(req.user.id);
    if (!agentProfile)
      return res.status(404).json({ message: "Agent profile not found" });

    const withdrawals = await prisma.agentWithdrawal.findMany({
      where: { agentId: agentProfile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Serialize Decimal fields
    const serialized = withdrawals.map((w) => ({
      ...w,
      amount: Number(w.amount),
    }));

    return res.json({ data: { withdrawals: serialized } });
  } catch (err) {
    console.error("getWithdrawalHistory:", err);
    return res.status(500).json({ message: "Failed to fetch withdrawal history" });
  }
}

// ─── POST /agent/earnings/withdraw ───────────────────────────────────────────
async function createWithdrawal(req, res) {
  try {
    const agentProfile = await resolveAgentProfile(req.user.id);
    if (!agentProfile)
      return res.status(404).json({ message: "Agent profile not found" });

    const { amount, paymentMethodId } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount < 1000) {
      return res
        .status(400)
        .json({ message: "Minimum withdrawal amount is ₹1,000" });
    }

    if (!paymentMethodId) {
      return res
        .status(400)
        .json({ message: "Payment method is required" });
    }

    // Verify method belongs to this agent and is not deleted
    const method = await prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, agentId: agentProfile.id, isDeleted: false },
    });
    if (!method)
      return res.status(400).json({ message: "Invalid payment method" });

    // Recalculate available balance server-side
    const summary = await computeSummary(agentProfile.id);

    if (numAmount > summary.availableBalance) {
      return res.status(400).json({
        message: `Insufficient balance. Available: ₹${summary.availableBalance.toFixed(2)}`,
      });
    }

    // Block if there's already a pending withdrawal
    const hasPending = await prisma.agentWithdrawal.findFirst({
      where: { agentId: agentProfile.id, status: "pending" },
    });
    if (hasPending) {
      return res.status(400).json({
        message:
          "You already have a pending withdrawal. Wait for it to be processed before requesting another.",
      });
    }

    const methodSnapshot = buildMethodSnapshot(method);
    const transactionId = generateTxnId();
    const expectedAt = addBusinessDays(new Date(), 5);

    const withdrawal = await prisma.agentWithdrawal.create({
      data: {
        agentId: agentProfile.id,
        paymentMethodId: method.id,
        amount: numAmount,
        status: "pending",
        transactionId,
        methodSnapshot,
        expectedAt,
      },
    });

    return res.status(201).json({
      data: {
        withdrawal: {
          ...withdrawal,
          amount: Number(withdrawal.amount),
        },
      },
    });
  } catch (err) {
    console.error("createWithdrawal:", err);
    return res.status(500).json({ message: "Failed to create withdrawal request" });
  }
}

module.exports = { getEarningsSummary, getWithdrawalHistory, createWithdrawal };
