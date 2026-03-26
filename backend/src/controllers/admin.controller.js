const { ok } = require("../utils/apiResponse");
const { prisma } = require("../lib/prisma");

async function listAllBookings(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  try {
    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          transaction: true,
        },
      }),
      prisma.booking.count(),
    ]);

    return ok(res, "Admin bookings fetched successfully", {
      items,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin bookings",
      errors: [],
    });
  }
}

async function analyticsOverview(_req, res) {
  try {
    const [bookings, packages] = await Promise.all([
      prisma.booking.findMany({
        include: {
          package: {
            include: {
              agent: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.travelPackage.findMany({
        where: { isActive: true },
      }),
    ]);

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalAmount), 0);

    const agentMap = new Map();
    const packageMap = new Map();
    const trendMap = new Map();

    for (const booking of bookings) {
      const agentId = booking.package.agentId;
      const agentName = booking.package.agent.user.name;
      const packageId = booking.package.id;
      const packageTitle = booking.package.title;
      const dateKey = booking.bookingDate.toISOString().slice(0, 10);

      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, { agent_id: agentId, agent_name: agentName, total_bookings: 0 });
      }
      agentMap.get(agentId).total_bookings += 1;

      if (!packageMap.has(packageId)) {
        packageMap.set(packageId, { package_id: packageId, package_title: packageTitle, total_bookings: 0 });
      }
      packageMap.get(packageId).total_bookings += 1;

      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    }

    const topAgents = Array.from(agentMap.values())
      .sort((a, b) => b.total_bookings - a.total_bookings)
      .slice(0, 5);

    const topPackages = Array.from(packageMap.values())
      .sort((a, b) => b.total_bookings - a.total_bookings)
      .slice(0, 5);

    const bookingTrend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return ok(res, "Admin analytics fetched successfully", {
      total_bookings: totalBookings,
      total_revenue: Number(totalRevenue.toFixed(2)),
      active_packages: packages.length,
      top_agents: topAgents,
      top_packages: topPackages,
      booking_trend: bookingTrend,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics overview",
      errors: [],
    });
  }
}

module.exports = { listAllBookings, analyticsOverview };
