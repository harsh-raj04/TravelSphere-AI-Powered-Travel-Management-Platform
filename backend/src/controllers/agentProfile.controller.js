const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");
const {
  generateOtp,
  sendEmailOtp,
  sendSmsOtp,
  createOtpRecord,
  verifyOtpRecord,
} = require("../services/otp.service");

// ─── Validation schemas ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  agencyName: z.string().min(2, "Agency name must be at least 2 characters").max(150).optional(),
}).refine((d) => d.name !== undefined || d.agencyName !== undefined, {
  message: "Provide at least one field to update (name or agencyName)",
});

const emailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

const verifyEmailSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newEmail: z.string().email("Invalid email address"),
});

// Indian 10-digit mobile: starts with 6-9
const phoneRegex = /^[6-9]\d{9}$/;

const phoneSchema = z.object({
  newPhone: z.string().regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
});

const verifyPhoneSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPhone: z.string().regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
});

// ─── Helper: build the profile response shape ─────────────────────────────────

async function fetchFullProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agentProfile: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    agentProfile: user.agentProfile
      ? {
          id: user.agentProfile.id,
          agencyName: user.agentProfile.agencyName,
          contactNumber: user.agentProfile.contactNumber,
          bio: user.agentProfile.bio,
          isVerified: user.agentProfile.isVerified,
          agentRating: user.agentProfile.agentRating,
          createdAt: user.agentProfile.createdAt,
        }
      : null,
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/agent/profile
 * Returns the authenticated agent's full profile.
 */
async function getMyProfile(req, res) {
  try {
    const profile = await fetchFullProfile(req.user.id);
    if (!profile) return fail(res, "Profile not found", [], 404);

    return ok(res, "Profile fetched", { profile });
  } catch (_err) {
    return fail(res, "Failed to fetch profile", [], 500);
  }
}

/**
 * PUT /api/v1/agent/profile
 * Updates non-sensitive fields: name and/or agencyName.
 */
async function updateProfile(req, res) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, "Validation failed", parsed.error.errors, 400);
    }

    const { name, agencyName } = parsed.data;

    // Run both updates in a transaction if both fields are provided
    await prisma.$transaction(async (tx) => {
      if (name !== undefined) {
        await tx.user.update({ where: { id: req.user.id }, data: { name } });
      }
      if (agencyName !== undefined) {
        await tx.agentProfile.update({
          where: { userId: req.user.id },
          data: { agencyName },
        });
      }
    });

    const profile = await fetchFullProfile(req.user.id);
    return ok(res, "Profile updated", { profile });
  } catch (_err) {
    return fail(res, "Failed to update profile", [], 500);
  }
}

/**
 * POST /api/v1/agent/profile/request-email-change
 * Sends a 6-digit OTP to the new email via SES.
 */
async function requestEmailChange(req, res) {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, "Validation failed", parsed.error.errors, 400);
    }

    const { newEmail } = parsed.data;

    // Check new email is not already used by another account
    const existing = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: req.user.id } },
    });
    if (existing) {
      return fail(res, "This email address is already in use by another account", [], 409);
    }

    const otp = generateOtp();
    await createOtpRecord(req.user.id, "email_change", otp, newEmail);

    try {
      await sendEmailOtp(newEmail, otp);
    } catch (awsErr) {
      console.error("[OTP] SES send failed:", awsErr);
      return fail(res, "Failed to send OTP email. Please try again.", [], 502);
    }

    return ok(res, "OTP sent to new email address");
  } catch (_err) {
    return fail(res, "Failed to initiate email change", [], 500);
  }
}

/**
 * POST /api/v1/agent/profile/verify-email-change
 * Verifies OTP then updates User.email.
 */
async function verifyEmailChange(req, res) {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, "Validation failed", parsed.error.errors, 400);
    }

    const { otp, newEmail } = parsed.data;

    try {
      await verifyOtpRecord(req.user.id, "email_change", otp, newEmail);
    } catch (otpErr) {
      return fail(res, otpErr.message, [], 400);
    }

    // Check again: email could have been taken between OTP request and verify
    const collision = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: req.user.id } },
    });
    if (collision) {
      return fail(res, "This email address was taken by another account. Please start over.", [], 409);
    }

    await prisma.user.update({ where: { id: req.user.id }, data: { email: newEmail } });

    const profile = await fetchFullProfile(req.user.id);
    return ok(res, "Email updated successfully", { profile });
  } catch (_err) {
    return fail(res, "Failed to verify email change", [], 500);
  }
}

/**
 * POST /api/v1/agent/profile/request-phone-change
 * Validates a 10-digit Indian number, converts to E.164, sends OTP via SNS.
 */
async function requestPhoneChange(req, res) {
  try {
    const parsed = phoneSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, "Validation failed", parsed.error.errors, 400);
    }

    const { newPhone } = parsed.data;
    const e164Phone = `+91${newPhone}`;

    const otp = generateOtp();
    // Store the plain 10-digit number as newValue for consistent comparison on verify
    await createOtpRecord(req.user.id, "phone_change", otp, newPhone);

    try {
      await sendSmsOtp(e164Phone, otp);
    } catch (awsErr) {
      console.error("[OTP] SNS send failed:", awsErr);
      return fail(res, "Failed to send OTP SMS. Please try again.", [], 502);
    }

    return ok(res, "OTP sent to new phone number");
  } catch (_err) {
    return fail(res, "Failed to initiate phone change", [], 500);
  }
}

/**
 * POST /api/v1/agent/profile/verify-phone-change
 * Verifies OTP then updates AgentProfile.contactNumber.
 */
async function verifyPhoneChange(req, res) {
  try {
    const parsed = verifyPhoneSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, "Validation failed", parsed.error.errors, 400);
    }

    const { otp, newPhone } = parsed.data;

    try {
      await verifyOtpRecord(req.user.id, "phone_change", otp, newPhone);
    } catch (otpErr) {
      return fail(res, otpErr.message, [], 400);
    }

    await prisma.agentProfile.update({
      where: { userId: req.user.id },
      data: { contactNumber: newPhone },
    });

    const profile = await fetchFullProfile(req.user.id);
    return ok(res, "Phone number updated successfully", { profile });
  } catch (_err) {
    return fail(res, "Failed to verify phone change", [], 500);
  }
}

module.exports = {
  getMyProfile,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  requestPhoneChange,
  verifyPhoneChange,
};
