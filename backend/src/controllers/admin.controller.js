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
    // Query 1: Get booking aggregates & totals (more efficient than loading all records)
    const bookingStats = await prisma.booking.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Query 2: Get booking counts by status & date efficiently
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ["status"],
      _count: true,
    });

    // Query 3: Get top agents by booking count (limit to top 5 from DB)
    const topAgentIds = await prisma.booking.groupBy({
      by: ["packageId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 100, // Get raw data to process
    });

    // Query 4: Get package names and agent info for top agents
    const topPackagesData = await prisma.travelPackage.findMany({
      where: {
        id: { in: topAgentIds.map((a) => a.packageId).slice(0, 5) },
      },
      include: {
        agent: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Query 5: Get active packages count
    const activePackagesCount = await prisma.travelPackage.count({
      where: { isActive: true },
    });

    // Query 6: Get transaction stats (only last 100 bookings for trends to avoid N+1)
    const recentBookingsForTrends = await prisma.booking.findMany({
      select: {
        id: true,
        bookingDate: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { bookingDate: "desc" },
      take: 100,
    });

    // Query 7: Get transaction status breakdown
    const transactionStats = await prisma.transaction.groupBy({
      by: ["status"],
      _count: true,
    });

    // Process data for response
    const totalBookings = bookingStats._count.id;
    const totalRevenue = Number(bookingStats._sum.totalAmount || 0).toFixed(2);

    // Build status breakdown
    const bookingStatusBreakdown = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
    };
    bookingsByStatus.forEach((item) => {
      const key = String(item.status || "").toLowerCase();
      if (bookingStatusBreakdown.hasOwnProperty(key)) {
        bookingStatusBreakdown[key] = item._count;
      }
    });

    // Build transaction status breakdown
    const transactionStatusBreakdown = {
      initiated: 0,
      success: 0,
      failed: 0,
      refunded: 0,
      no_transaction: 0,
    };
    transactionStats.forEach((item) => {
      const key = String(item.status || "").toLowerCase();
      if (transactionStatusBreakdown.hasOwnProperty(key)) {
        transactionStatusBreakdown[key] = item._count;
      }
    });

    // Set no_transaction count
    transactionStatusBreakdown.no_transaction = totalBookings - transactionStats.reduce((sum, s) => sum + s._count, 0);

    // Build top agents list
    const topAgents = topPackagesData
      .slice(0, 5)
      .map((pkg) => {
        const bookingCount = topAgentIds.find((a) => a.packageId === pkg.id);
        return {
          agent_id: pkg.agent.id,
          agent_name: pkg.agent.user.name,
          total_bookings: bookingCount?._count?.id || 0,
        };
      })
      .sort((a, b) => b.total_bookings - a.total_bookings)
      .slice(0, 5);

    // Build top packages list (limit to 5)
    const topPackages = topPackagesData
      .slice(0, 5)
      .map((pkg) => {
        const bookingCount = topAgentIds.find((a) => a.packageId === pkg.id);
        return {
          package_id: pkg.id,
          package_title: pkg.title,
          total_bookings: bookingCount?._count?.id || 0,
        };
      })
      .sort((a, b) => b.total_bookings - a.total_bookings)
      .slice(0, 5);

    // Build trends from recent bookings (last 100)
    const bookingTrendMap = new Map();
    const revenueTrendMap = new Map();

    recentBookingsForTrends.forEach((booking) => {
      const dateKey = new Date(booking.bookingDate).toISOString().slice(0, 10);
      bookingTrendMap.set(dateKey, (bookingTrendMap.get(dateKey) || 0) + 1);
      revenueTrendMap.set(dateKey, (revenueTrendMap.get(dateKey) || 0) + Number(booking.totalAmount || 0));
    });

    const bookingTrend = Array.from(bookingTrendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const revenueTrend = Array.from(revenueTrendMap.entries())
      .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate payment success rate
    const totalTransactions = transactionStats.reduce((sum, s) => sum + s._count, 0);
    const successfulTransactions = transactionStatusBreakdown.success;
    const paymentSuccessRate = totalTransactions ? Number(((successfulTransactions / totalTransactions) * 100).toFixed(1)) : 0;

    return ok(res, "Admin analytics fetched successfully", {
      total_bookings: totalBookings,
      total_revenue: Number(totalRevenue),
      active_packages: activePackagesCount,
      top_agents: topAgents,
      top_packages: topPackages,
      booking_trend: bookingTrend,
      revenue_trend: revenueTrend,
      booking_status_breakdown: bookingStatusBreakdown,
      transaction_status_breakdown: transactionStatusBreakdown,
      payment_success_rate: paymentSuccessRate,
    });
  } catch (_error) {
    console.error("Analytics error:", _error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics overview",
      errors: [],
    });
  }
}

async function listAllPackages(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const search = String(req.query.search || "").trim();

  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { destination: { contains: search, mode: "insensitive" } },
      {
        agent: {
          is: {
            user: {
              is: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      },
    ];
  }

  try {
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
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      prisma.travelPackage.count({ where }),
    ]);

    return ok(res, "Admin packages fetched successfully", {
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
      message: "Failed to fetch admin packages",
      errors: [],
    });
  }
}

async function listAllAgents(_req, res) {
  try {
    const [agents, bookings] = await Promise.all([
      prisma.agentProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              packages: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        include: {
          package: {
            select: {
              agentId: true,
            },
          },
        },
      }),
    ]);

    const bookingsMap = new Map();
    const revenueMap = new Map();

    for (const booking of bookings) {
      const agentId = booking.package.agentId;
      bookingsMap.set(agentId, (bookingsMap.get(agentId) || 0) + 1);
      revenueMap.set(agentId, (revenueMap.get(agentId) || 0) + Number(booking.totalAmount || 0));
    }

    const items = agents.map((agent) => ({
      id: agent.id,
      user_id: agent.user.id,
      name: agent.user.name,
      email: agent.user.email,
      phone: agent.contactNumber,
      status: agent.isVerified ? "active" : "pending",
      packages_count: agent._count.packages,
      bookings_handled: bookingsMap.get(agent.id) || 0,
      revenue: Number((revenueMap.get(agent.id) || 0).toFixed(2)),
      joined_date: agent.createdAt,
      agency_name: agent.agencyName,
    }));

    return ok(res, "Admin agents fetched successfully", { items });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin agents",
      errors: [],
    });
  }
}

async function listAllCustomers(_req, res) {
  try {
    const [customers, grouped] = await Promise.all([
      prisma.user.findMany({
        where: { role: "customer" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.groupBy({
        by: ["customerId"],
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const groupedMap = new Map(grouped.map((row) => [row.customerId, row]));

    const items = customers.map((customer) => {
      const aggregate = groupedMap.get(customer.id);
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: null,
        total_bookings: aggregate?._count?.id || 0,
        total_spent: Number(aggregate?._sum?.totalAmount || 0),
        status: "active",
        joined_date: customer.createdAt,
      };
    });

    return ok(res, "Admin customers fetched successfully", { items });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin customers",
      errors: [],
    });
  }
}

async function listAllTransactions(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const status = String(req.query.status || "").trim();

  const where = {};
  if (status) {
    where.status = status;
  }

  try {
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              customer: {
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
      prisma.transaction.count({ where }),
    ]);

    return ok(res, "Admin transactions fetched successfully", {
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
      message: "Failed to fetch admin transactions",
      errors: [],
    });
  }
}

module.exports = {
  listAllBookings,
  analyticsOverview,
  listAllPackages,
  listAllAgents,
  listAllCustomers,
  listAllTransactions,
};
