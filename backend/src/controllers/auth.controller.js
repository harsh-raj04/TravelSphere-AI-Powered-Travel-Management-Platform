const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { env } = require("../config/env");
const { ROLES } = require("../constants/roles");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");
const {
  generateOtp,
  sendRegistrationEmailOtp,
  createRegistrationOtp,
  verifyRegistrationOtp,
} = require("../services/otp.service");
const { sendWelcomeEmail } = require("../services/emailService");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([ROLES.CUSTOMER, ROLES.AGENT]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return fail(res, "Validation failed", [{ field: "email", issue: "Email already exists" }], 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
    });

    if (user.role === ROLES.AGENT) {
      await prisma.agentProfile.create({
        data: {
          userId: user.id,
          agencyName: `${user.name} Travels`,
        },
      });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return ok(
      res,
      "User registered successfully",
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201
    );
  } catch (_error) {
    return fail(res, "Failed to register user", [], 500);
  }
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      return fail(res, "Invalid credentials", [], 401);
    }

    const isMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!isMatch) {
      return fail(res, "Invalid credentials", [], 401);
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    return ok(res, "Login successful", {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (_error) {
    return fail(res, "Failed to login", [], 500);
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        agentProfile: true,
      },
    });

    if (!user) {
      return fail(res, "User not found", [], 404);
    }

    return ok(res, "Authenticated user", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        agentProfile: user.agentProfile,
      },
    });
  } catch (_error) {
    return fail(res, "Failed to fetch user", [], 500);
  }
}

const sendOtpSchema = z.object({
  email: z.string().email(),
});

async function sendRegistrationOtp(req, res) {
  const parsed = sendOtpSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Validation failed", parsed.error.issues, 400);

  const { email } = parsed.data;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail(res, "Validation failed", [{ field: "email", issue: "An account with this email already exists. Try logging in instead." }], 400);

    const otp = generateOtp();
    await createRegistrationOtp(email, otp);

    // Always log OTP — useful as fallback if email fails in dev
    console.log(`\n[OTP] Registration code for ${email}: ${otp}\n`);

    try {
      await sendRegistrationEmailOtp(email, otp);
    } catch (emailErr) {
      console.error("[OTP] Email send failed:", emailErr.message);
      if (process.env.NODE_ENV === "production") {
        return fail(res, "Failed to send verification email. Please try again.", [], 502);
      }
    }

    return ok(res, "Verification code sent to your email");
  } catch (_err) {
    return fail(res, "Failed to send OTP", [], 500);
  }
}

const verifyAndRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  otp: z.string().length(6),
});

async function verifyOtpAndRegister(req, res) {
  const parsed = verifyAndRegisterSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Validation failed", parsed.error.issues, 400);

  const { name, email, password, otp } = parsed.data;
  try {
    try {
      await verifyRegistrationOtp(email, otp);
    } catch (otpErr) {
      return fail(res, otpErr.message, [], 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail(res, "Validation failed", [{ field: "email", issue: "Email already exists" }], 400);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: ROLES.CUSTOMER },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(err => console.error("[email] Welcome email failed:", err.message));

    return ok(res, "Account created successfully", {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 201);
  } catch (_err) {
    return fail(res, "Registration failed. Please try again.", [], 500);
  }
}

module.exports = { register, login, me, sendRegistrationOtp, verifyOtpAndRegister };
