const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

const packageSchema = z.object({
  title: z.string().min(2),
  destination: z.string().min(2),
  duration_days: z.number().int().positive(),
  price: z.number().positive(),
  description: z.string().min(10),
});

async function listPackages(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const destination = req.query.destination;
  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  const duration = Number(req.query.duration);

  try {
    const where = {
      isActive: true,
    };

    if (destination) {
      where.destination = { contains: destination, mode: "insensitive" };
    }

    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      where.price = {};
      if (!Number.isNaN(minPrice)) {
        where.price.gte = minPrice;
      }
      if (!Number.isNaN(maxPrice)) {
        where.price.lte = maxPrice;
      }
    }

    if (!Number.isNaN(duration)) {
      where.durationDays = duration;
    }

    const [items, total] = await Promise.all([
      prisma.travelPackage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          agent: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.travelPackage.count({ where }),
    ]);

    return ok(res, "Packages fetched successfully", {
      items,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (_error) {
    return fail(res, "Failed to fetch packages", [], 500);
  }
}

async function getPackageById(req, res) {
  try {
    const item = await prisma.travelPackage.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
      },
      include: {
        agent: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return fail(res, "Package not found", [], 404);
    }

    return ok(res, "Package fetched successfully", item);
  } catch (_error) {
    return fail(res, "Failed to fetch package", [], 500);
  }
}

async function createPackage(req, res) {
  const parsed = packageSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  try {
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!agentProfile) {
      return fail(res, "Agent profile not found", [], 403);
    }

    const created = await prisma.travelPackage.create({
      data: {
        agentId: agentProfile.id,
        title: parsed.data.title,
        destination: parsed.data.destination,
        durationDays: parsed.data.duration_days,
        price: parsed.data.price,
        description: parsed.data.description,
      },
    });

    return ok(res, "Package created successfully", created, 201);
  } catch (_error) {
    return fail(res, "Failed to create package", [], 500);
  }
}

async function updatePackage(req, res) {
  const parsed = packageSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  try {
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!agentProfile) {
      return fail(res, "Agent profile not found", [], 403);
    }

    const existing = await prisma.travelPackage.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || !existing.isActive) {
      return fail(res, "Package not found", [], 404);
    }

    if (existing.agentId !== agentProfile.id) {
      return fail(res, "Forbidden: package ownership mismatch", [], 403);
    }

    const updated = await prisma.travelPackage.update({
      where: { id: req.params.id },
      data: {
        title: parsed.data.title,
        destination: parsed.data.destination,
        durationDays: parsed.data.duration_days,
        price: parsed.data.price,
        description: parsed.data.description,
      },
    });

    return ok(res, "Package updated successfully", updated);
  } catch (_error) {
    return fail(res, "Failed to update package", [], 500);
  }
}

async function deletePackage(req, res) {
  try {
    const existing = await prisma.travelPackage.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || !existing.isActive) {
      return fail(res, "Package not found", [], 404);
    }

    if (req.user.role !== "admin") {
      const agentProfile = await prisma.agentProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!agentProfile || existing.agentId !== agentProfile.id) {
        return fail(res, "Forbidden: package ownership mismatch", [], 403);
      }
    }

    const updated = await prisma.travelPackage.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return ok(res, "Package deleted successfully", updated);
  } catch (_error) {
    return fail(res, "Failed to delete package", [], 500);
  }
}

module.exports = {
  listPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
};
