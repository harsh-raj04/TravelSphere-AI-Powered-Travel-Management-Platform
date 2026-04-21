const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { env } = require("../config/env");
const { ROLES } = require("../constants/roles");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

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

module.exports = { register, login, me };
