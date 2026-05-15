const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

const PROFILE_SELECT = {
  id: true, name: true, email: true, role: true, createdAt: true,
  phone: true, dateOfBirth: true, gender: true, city: true, state: true,
  languages: true, travelPreferences: true, emergencyContact: true,
  notificationPrefs: true, privacySettings: true, referralCode: true,
};

function generateReferralCode(name, id) {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
  const suffix = id.slice(-4).toUpperCase();
  return `${prefix}${suffix}`;
}

async function getProfile(req, res) {
  try {
    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: PROFILE_SELECT,
    });

    if (!user) return fail(res, "User not found", [], 404);

    if (!user.referralCode) {
      const code = generateReferralCode(user.name, user.id);
      try {
        user = await prisma.user.update({
          where: { id: req.user.id },
          data: { referralCode: code },
          select: PROFILE_SELECT,
        });
      } catch {
        // unique conflict — another code exists, continue with existing user
      }
    }

    return ok(res, "Profile fetched", { profile: user });
  } catch {
    return fail(res, "Failed to fetch profile", [], 500);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  languages: z.array(z.string()).nullable().optional(),
  travelPreferences: z.object({
    travelStyle: z.array(z.string()).optional(),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    destinationTypes: z.array(z.string()).optional(),
    frequency: z.string().optional(),
    dietary: z.string().optional(),
    specialRequirements: z.string().optional(),
  }).nullable().optional(),
  emergencyContact: z.object({
    name: z.string(),
    relation: z.string(),
    phone: z.string(),
  }).nullable().optional(),
  notificationPrefs: z.object({}).passthrough().nullable().optional(),
  privacySettings: z.object({}).passthrough().nullable().optional(),
});

async function updateProfile(req, res) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Validation failed", parsed.error.issues, 400);

  try {
    const data = { ...parsed.data };
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: PROFILE_SELECT,
    });

    return ok(res, "Profile updated", { profile: user });
  } catch {
    return fail(res, "Failed to update profile", [], 500);
  }
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

async function changePassword(req, res) {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Validation failed", parsed.error.issues, 400);

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return fail(res, "User not found", [], 404);

    const isMatch = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isMatch) return fail(res, "Current password is incorrect", [], 400);

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

    return ok(res, "Password changed successfully");
  } catch {
    return fail(res, "Failed to change password", [], 500);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
