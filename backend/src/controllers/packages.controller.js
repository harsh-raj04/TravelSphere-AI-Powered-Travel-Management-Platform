const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

const packageSchema = z.object({
  title: z.string().min(2),
  destination: z.string().min(2).optional(),
  durationDays: z.number().int().positive(),
  price: z.number().positive(),
  description: z.string().min(10),
  category: z.string().optional(),
  bannerImage: z.string().optional(),
  itineraries: z.array(z.object({
    dayNumber: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    morningActivity: z.string().nullable().optional(),
    afternoonActivity: z.string().nullable().optional(),
    eveningActivity: z.string().nullable().optional(),
    nightActivity: z.string().nullable().optional(),
    locations: z.union([z.array(z.string()), z.string()]).transform((v) => typeof v === 'string' ? JSON.parse(v) : v).optional(),
    activities: z.union([z.array(z.string()), z.string()]).transform((v) => typeof v === 'string' ? JSON.parse(v) : v).optional(),
  })).optional(),
  pricingOptions: z.array(z.object({
    roomType: z.string().min(1),
    price: z.number().positive(),
  })).optional(),
  departures: z.array(z.object({
    departureDate: z.string().nullable().optional().transform((v) => v || null),
    availableSeats: z.number().int().positive().optional(),
    price: z.number().positive().optional(),
    isActive: z.boolean().optional(),
  })).optional(),
  inclusions: z.array(z.object({
    type: z.string().min(1),
    description: z.string().min(1),
  })).optional(),
  addOns: z.array(z.object({
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    price: z.number().positive(),
  })).optional(),
});

const packageInterestSchema = z.object({
  availability: z.string().min(2).max(40).optional(),
  message: z.string().min(2).max(500).optional(),
});

async function getFeaturedPackages(req, res) {
  try {
    const items = await prisma.travelPackage.findMany({
      where: {
        isActive: true,
        featuredRank: { not: null },
      },
      orderBy: { featuredRank: "asc" },
      take: 7,
    });
    return ok(res, "Featured packages fetched", { items });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch featured packages", errors: [] });
  }
}

async function listPackages(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 50);
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
        hasMore: page * limit < total,
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
    const data = parsed.data;
    const created = await prisma.travelPackage.create({
      data: {
        title: data.title,
        destination: data.destination,
        durationDays: data.durationDays,
        price: data.price,
        description: data.description,
        category: data.category || null,
        bannerImage: data.bannerImage || null,
        itineraries: data.itineraries?.length ? data.itineraries : undefined,
        pricingOptions: data.pricingOptions?.length ? data.pricingOptions : undefined,
        departures: data.departures?.length ? { create: data.departures.map((d) => ({
          departureDate: d.departureDate ? new Date(d.departureDate) : null,
          availableSeats: d.availableSeats || 20,
          price: d.price || data.price,
          isActive: d.isActive !== false,
        })) } : undefined,
        inclusions: data.inclusions?.length ? { create: data.inclusions.map((inc) => ({
          type: inc.type,
          description: inc.description,
        })) } : undefined,
        addOns: data.addOns?.length ? { create: data.addOns.map((ao) => ({
          title: ao.title,
          description: ao.description || null,
          price: ao.price,
        })) } : undefined,
      },
      include: {
        itineraries: true,
        pricingOptions: true,
        departures: true,
        inclusions: true,
        addOns: true,
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
    const existing = await prisma.travelPackage.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || !existing.isActive) {
      return fail(res, "Package not found", [], 404);
    }

    const durationDays = parsed.data.duration_days ?? existing.durationDays;
    const itinerary = parsed.data.itinerary;
    if (Array.isArray(itinerary) && itinerary.length > 0 && itinerary.length !== durationDays) {
      return fail(res, "Validation failed", [{ field: "itinerary", issue: "Itinerary day count must match duration" }], 400);
    }

    const updated = await prisma.travelPackage.update({
      where: { id: req.params.id },
      data: {
        title: parsed.data.title,
        destination: parsed.data.destination,
        durationDays: parsed.data.duration_days,
        price: parsed.data.price,
        description: parsed.data.description,
        itinerary: Array.isArray(parsed.data.itinerary) ? parsed.data.itinerary : undefined,
        imageUrls: Array.isArray(parsed.data.image_urls) ? parsed.data.image_urls : undefined,
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

    const updated = await prisma.travelPackage.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return ok(res, "Package deleted successfully", updated);
  } catch (_error) {
    return fail(res, "Failed to delete package", [], 500);
  }
}

async function optInForPackage(req, res) {
  const parsed = packageInterestSchema.safeParse(req.body || {});
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

    const travelPackage = await prisma.travelPackage.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
      },
    });

    if (!travelPackage) {
      return fail(res, "Package not found", [], 404);
    }

    const record = await prisma.packageInterest.upsert({
      where: {
        packageId_agentId: {
          packageId: travelPackage.id,
          agentId: agentProfile.id,
        },
      },
      create: {
        packageId: travelPackage.id,
        agentId: agentProfile.id,
        availability: parsed.data.availability || "available",
        message: parsed.data.message || null,
      },
      update: {
        availability: parsed.data.availability || "available",
        message: parsed.data.message || null,
      },
      include: {
        package: true,
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

    return ok(res, "Package opt-in saved successfully", record, 201);
  } catch (_error) {
    return fail(res, "Failed to save package opt-in", [], 500);
  }
}

async function optOutForPackage(req, res) {
  try {
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!agentProfile) {
      return fail(res, "Agent profile not found", [], 403);
    }

    const interest = await prisma.packageInterest.findUnique({
      where: {
        packageId_agentId: {
          packageId: req.params.id,
          agentId: agentProfile.id,
        },
      },
    });

    if (!interest) {
      return fail(res, "You have not opted in for this package", [], 404);
    }

    await prisma.packageInterest.delete({
      where: {
        packageId_agentId: {
          packageId: req.params.id,
          agentId: agentProfile.id,
        },
      },
    });

    return ok(res, "Successfully opted out of package", null, 200);
  } catch (_error) {
    return fail(res, "Failed to opt out of package", [], 500);
  }
}

async function myPackageInterests(req, res) {
  try {
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!agentProfile) {
      return fail(res, "Agent profile not found", [], 403);
    }

    const items = await prisma.packageInterest.findMany({
      where: { agentId: agentProfile.id },
      orderBy: { updatedAt: "desc" },
      include: {
        package: {
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
        },
      },
    });

    return ok(res, "Agent package interests fetched successfully", { items });
  } catch (_error) {
    return fail(res, "Failed to fetch package interests", [], 500);
  }
}

async function getPackageDetails(req, res) {
  try {
    const pkg = await prisma.travelPackage.findFirst({
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
        itineraries: {
          orderBy: { dayNumber: "asc" },
        },
        pricingOptions: {
          orderBy: { roomType: "asc" },
        },
        departures: {
          where: { isActive: true },
          orderBy: { departureDate: "asc" },
        },
        inclusions: true,
        addOns: true,
      },
    });

    if (!pkg) {
      return fail(res, "Package not found", [], 404);
    }

    // Parse JSON fields from database
    const transformedPkg = {
      ...pkg,
      itineraries: pkg.itineraries.map((it) => ({
        ...it,
        locations: JSON.parse(it.locations || "[]"),
        activities: JSON.parse(it.activities || "[]"),
      })),
    };

    return ok(res, "Package details fetched successfully", transformedPkg);
  } catch (_error) {
    console.error("Error fetching package details:", _error);
    return fail(res, "Failed to fetch package details", [], 500);
  }
}

async function getDestinationCounts(req, res) {
  try {
    const counts = await prisma.travelPackage.groupBy({
      by: ['destination'],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const result = counts.map((row) => ({
      destination: row.destination,
      count: row._count.id,
    }));

    return ok(res, 'Destination counts fetched successfully', result);
  } catch (_error) {
    console.error('Error fetching destination counts:', _error);
    return fail(res, 'Failed to fetch destination counts', [], 500);
  }
}

async function getTermsSections(req, res) {
  try {
    const terms = await prisma.termsSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, order: true, title: true, content: true },
    });
    return ok(res, 'Terms fetched successfully', terms);
  } catch (_error) {
    console.error('Error fetching terms:', _error);
    return fail(res, 'Failed to fetch terms', [], 500);
  }
}

module.exports = {
  listPackages,
  getPackageById,
  getPackageDetails,
  getDestinationCounts,
  getFeaturedPackages,
  getTermsSections,
  createPackage,
  updatePackage,
  deletePackage,
  optInForPackage,
  optOutForPackage,
  myPackageInterests,
};
