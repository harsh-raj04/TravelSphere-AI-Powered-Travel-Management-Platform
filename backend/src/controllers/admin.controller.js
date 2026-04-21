const { ok } = require("../utils/apiResponse");
const { prisma } = require("../lib/prisma");

async function listAllBookings(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const search = String(req.query.search || "").trim();
  const bookingStatus = String(req.query.booking_status || "").trim();
  const transactionStatus = String(req.query.transaction_status || "").trim();

  const where = {};

  if (bookingStatus) {
    where.status = bookingStatus;
  }

  if (transactionStatus) {
    where.transaction = {
      is: {
        status: transactionStatus,
      },
    };
  }

  if (search) {
    where.OR = [
      {
        customer: {
          is: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        customer: {
          is: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        package: {
          is: {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        package: {
          is: {
            destination: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        package: {
          is: {
            agent: {
              is: {
                user: {
                  is: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
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
      prisma.booking.count({ where }),
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
    const bookingTrendMap = new Map();
    const revenueTrendMap = new Map();
    const bookingStatusBreakdown = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
    };
    const transactionStatusBreakdown = {
      initiated: 0,
      success: 0,
      failed: 0,
      refunded: 0,
      no_transaction: 0,
    };

    for (const booking of bookings) {
      const agentId = booking.package.agentId;
      const agentName = booking.package.agent.user.name;
      const packageId = booking.package.id;
      const packageTitle = booking.package.title;
      const dateKey = booking.bookingDate.toISOString().slice(0, 10);
      const bookingStatus = String(booking.status || "").toLowerCase();
      const paymentStatus = String(booking.transaction?.status || "").toLowerCase();

      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, { agent_id: agentId, agent_name: agentName, total_bookings: 0 });
      }
      agentMap.get(agentId).total_bookings += 1;

      if (!packageMap.has(packageId)) {
        packageMap.set(packageId, { package_id: packageId, package_title: packageTitle, total_bookings: 0 });
      }
      packageMap.get(packageId).total_bookings += 1;

      bookingTrendMap.set(dateKey, (bookingTrendMap.get(dateKey) || 0) + 1);
      revenueTrendMap.set(dateKey, (revenueTrendMap.get(dateKey) || 0) + Number(booking.totalAmount || 0));

      if (Object.prototype.hasOwnProperty.call(bookingStatusBreakdown, bookingStatus)) {
        bookingStatusBreakdown[bookingStatus] += 1;
      }

      if (paymentStatus && Object.prototype.hasOwnProperty.call(transactionStatusBreakdown, paymentStatus)) {
        transactionStatusBreakdown[paymentStatus] += 1;
      } else {
        transactionStatusBreakdown.no_transaction += 1;
      }
    }

    const topAgents = Array.from(agentMap.values())
      .sort((a, b) => b.total_bookings - a.total_bookings)
      .slice(0, 5);

    const topPackages = Array.from(packageMap.values())
      .sort((a, b) => b.total_bookings - a.total_bookings)
      .slice(0, 5);

    const bookingTrend = Array.from(bookingTrendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const revenueTrend = Array.from(revenueTrendMap.entries())
      .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalTransactions = bookings.filter((booking) => Boolean(booking.transaction)).length;
    const successfulTransactions = transactionStatusBreakdown.success;
    const paymentSuccessRate = totalTransactions
      ? Number(((successfulTransactions / totalTransactions) * 100).toFixed(1))
      : 0;

    return ok(res, "Admin analytics fetched successfully", {
      total_bookings: totalBookings,
      total_revenue: Number(totalRevenue.toFixed(2)),
      active_packages: packages.length,
      top_agents: topAgents,
      top_packages: topPackages,
      booking_trend: bookingTrend,
      revenue_trend: revenueTrend,
      booking_status_breakdown: bookingStatusBreakdown,
      transaction_status_breakdown: transactionStatusBreakdown,
      payment_success_rate: paymentSuccessRate,
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
