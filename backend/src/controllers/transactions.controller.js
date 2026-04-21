const { z } = require("zod");
const { TRANSACTION_STATUS } = require("../constants/statuses");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

const createTransactionSchema = z.object({
  booking_id: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(2),
  status: z.enum([
    TRANSACTION_STATUS.INITIATED,
    TRANSACTION_STATUS.SUCCESS,
    TRANSACTION_STATUS.FAILED,
    TRANSACTION_STATUS.REFUNDED,
  ]),
});

async function createTransaction(req, res) {
  const parsed = createTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parsed.data.booking_id },
      include: {
        package: true,
      },
    });

    if (!booking) {
      return fail(res, "Booking not found", [], 404);
    }

    if (req.user.role === "customer" && booking.customerId !== req.user.id) {
      return fail(res, "Forbidden: booking ownership mismatch", [], 403);
    }

    const result = await prisma.transaction.upsert({
      where: { bookingId: booking.id },
      update: {
        amount: parsed.data.amount,
        paymentMethod: parsed.data.method,
        status: parsed.data.status,
      },
      create: {
        bookingId: booking.id,
        amount: parsed.data.amount,
        paymentMethod: parsed.data.method,
        status: parsed.data.status,
        transactionReference: `TXN-${Date.now()}`,
      },
    });

    return ok(res, "Transaction saved successfully", result, 201);
  } catch (_error) {
    return fail(res, "Failed to create transaction", [], 500);
  }
}

async function getTransactionByBookingId(req, res) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        package: true,
      },
    });

    if (!booking) {
      return fail(res, "Booking not found", [], 404);
    }

    if (req.user.role === "customer" && booking.customerId !== req.user.id) {
      return fail(res, "Forbidden: booking ownership mismatch", [], 403);
    }

    if (req.user.role === "agent") {
      const agentProfile = await prisma.agentProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!agentProfile || booking.package.agentId !== agentProfile.id) {
        return fail(res, "Forbidden: booking ownership mismatch", [], 403);
      }
    }

    const transaction = await prisma.transaction.findUnique({
      where: { bookingId: booking.id },
    });

    if (!transaction) {
      return fail(res, "Transaction not found", [], 404);
    }

    return ok(res, "Transaction fetched successfully", transaction);
  } catch (_error) {
    return fail(res, "Failed to fetch transaction", [], 500);
  }
}

module.exports = { createTransaction, getTransactionByBookingId };
