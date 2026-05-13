const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

// ─── Validation schemas ────────────────────────────────────────────────────────

const bankAccountSchema = z.object({
  type: z.literal("bank_account"),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(4, "Account number must be at least 4 digits"),
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  bankName: z.string().min(2, "Bank name is required"),
  isDefault: z.boolean().optional().default(false),
});

const upiSchema = z.object({
  type: z.literal("upi"),
  upiId: z
    .string()
    .regex(/^[\w.\-_]+@[\w.\-_]+$/, "Invalid UPI ID format (e.g. name@upi)"),
  isDefault: z.boolean().optional().default(false),
});

const cardSchema = z.object({
  type: z.literal("card"),
  cardHolderName: z.string().min(2, "Card holder name is required"),
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "Card number must be exactly 16 digits"),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be in MM/YY format"),
  isDefault: z.boolean().optional().default(false),
});

const addMethodSchema = z.discriminatedUnion("type", [
  bankAccountSchema,
  upiSchema,
  cardSchema,
]);

const updateMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

// ─── Helper: resolve agentProfile.id from req.user ────────────────────────────

async function resolveAgentProfileId(userId) {
  const profile = await prisma.agentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// ─── GET /api/agent/payment-methods ───────────────────────────────────────────

async function listPaymentMethods(req, res) {
  try {
    const agentId = await resolveAgentProfileId(req.user.id);
    if (!agentId) {
      return fail(res, "Agent profile not found", [], 404);
    }

    const methods = await prisma.paymentMethod.findMany({
      where: { agentId, isDeleted: false },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return ok(res, "Payment methods fetched", { methods });
  } catch (err) {
    console.error("[paymentMethods] listPaymentMethods error:", err);
    return fail(res, "Failed to fetch payment methods", [], 500);
  }
}

// ─── POST /api/agent/payment-methods ──────────────────────────────────────────

async function addPaymentMethod(req, res) {
  const parsed = addMethodSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  try {
    const agentId = await resolveAgentProfileId(req.user.id);
    if (!agentId) {
      return fail(res, "Agent profile not found", [], 404);
    }

    const data = parsed.data;
    const isDefault = data.isDefault ?? false;

    // Build the record to save — strip full numbers, keep only last 4
    const record = {
      agentId,
      type: data.type,
      isDefault,
    };

    if (data.type === "bank_account") {
      const raw = String(data.accountNumber).replace(/\D/g, "");
      record.accountHolderName = data.accountHolderName;
      record.accountNumber = raw.slice(-4);
      record.ifscCode = data.ifscCode.toUpperCase();
      record.bankName = data.bankName;
    } else if (data.type === "upi") {
      record.upiId = data.upiId;
    } else if (data.type === "card") {
      record.cardHolderName = data.cardHolderName;
      record.cardLastFour = data.cardNumber.slice(-4);
      record.expiryDate = data.expiryDate;
    }

    // If this is being set as default, unset all other defaults first
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { agentId, isDeleted: false, isDefault: true },
        data: { isDefault: false },
      });
    }

    const method = await prisma.paymentMethod.create({ data: record });

    return ok(res, "Payment method added", { method }, 201);
  } catch (err) {
    console.error("[paymentMethods] addPaymentMethod error:", err);
    return fail(res, "Failed to add payment method", [], 500);
  }
}

// ─── PUT /api/agent/payment-methods/:id ───────────────────────────────────────

async function updatePaymentMethod(req, res) {
  const parsed = updateMethodSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  try {
    const agentId = await resolveAgentProfileId(req.user.id);
    if (!agentId) {
      return fail(res, "Agent profile not found", [], 404);
    }

    const { id } = req.params;

    // Confirm the method belongs to this agent
    const existing = await prisma.paymentMethod.findFirst({
      where: { id, agentId, isDeleted: false },
    });
    if (!existing) {
      return fail(res, "Payment method not found", [], 404);
    }

    const updates = parsed.data;

    // If setting as default, unset all other defaults first
    if (updates.isDefault === true) {
      await prisma.paymentMethod.updateMany({
        where: { agentId, isDeleted: false, isDefault: true },
        data: { isDefault: false },
      });
    }

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: updates,
    });

    return ok(res, "Payment method updated", { method });
  } catch (err) {
    console.error("[paymentMethods] updatePaymentMethod error:", err);
    return fail(res, "Failed to update payment method", [], 500);
  }
}

// ─── DELETE /api/agent/payment-methods/:id ────────────────────────────────────

async function deletePaymentMethod(req, res) {
  try {
    const agentId = await resolveAgentProfileId(req.user.id);
    if (!agentId) {
      return fail(res, "Agent profile not found", [], 404);
    }

    const { id } = req.params;

    const existing = await prisma.paymentMethod.findFirst({
      where: { id, agentId, isDeleted: false },
    });
    if (!existing) {
      return fail(res, "Payment method not found", [], 404);
    }

    // Soft delete
    await prisma.paymentMethod.update({
      where: { id },
      data: { isDeleted: true, isDefault: false },
    });

    return ok(res, "Payment method removed");
  } catch (err) {
    console.error("[paymentMethods] deletePaymentMethod error:", err);
    return fail(res, "Failed to remove payment method", [], 500);
  }
}

module.exports = {
  listPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
