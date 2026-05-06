const { z } = require("zod");
const { ok } = require("../utils/apiResponse");
const { prisma } = require("../lib/prisma");
const { BOOKING_STATUS } = require("../constants/statuses");

const adminBookingStatusSchema = z.object({
  status: z.enum([
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.OPEN_FOR_AGENTS,
    BOOKING_STATUS.ASSIGNED,
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.IN_PROGRESS,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CLOSED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.REJECTED,
  ]),
  agent_id: z.string().trim().optional(),
  decision_remark: z.string().trim().max(500).optional(),
  rejection_reason: z.string().trim().max(200).optional(),
});

function financialBreakdown(totalAmount) {
  const total = Number(totalAmount || 0);
  const commission = Number((total * 0.25).toFixed(2));
  const gst = Number((total * 0.05).toFixed(2));
  const payout = Number((total - commission - gst).toFixed(2));

  return {
    total,
    commission,
    gst,
    payout,
  };
}

async function confirmBooking(req, res) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found", errors: [] });
    }

    if ([BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.OPEN_FOR_AGENTS, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CLOSED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
      return ok(res, "Booking is already confirmed", booking);
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be confirmed in its current state",
        errors: [],
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        package: true,
      },
    });

    return ok(res, "Booking confirmed and customer notified", updated);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to confirm booking",
      errors: [],
    });
  }
}

async function assignBookingAgent(req, res) {
  const agentId = String(req.body?.agent_id || "").trim();
  const agentPayout = Number(req.body?.agent_payout);

  if (!agentId) {
    return res.status(400).json({ success: false, message: "agent_id is required", errors: [] });
  }

  if (!Number.isFinite(agentPayout) || agentPayout <= 0) {
    return res.status(400).json({ success: false, message: "agent_payout must be positive", errors: [] });
  }

  try {
    const [booking, agentProfile] = await Promise.all([
      prisma.booking.findUnique({
        where: { id: req.params.id },
        include: { package: true },
      }),
      prisma.agentProfile.findUnique({ where: { id: agentId } }),
    ]);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found", errors: [] });
    }

    if (!agentProfile) {
      return res.status(400).json({ success: false, message: "Agent not found", errors: [] });
    }

    if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.OPEN_FOR_AGENTS].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Only confirmed or open bookings can be assigned",
        errors: [],
      });
    }

    const total = Number(booking.totalAmount || 0);
    if (agentPayout > total) {
      return res.status(400).json({
        success: false,
        message: "Agent payout cannot exceed booking amount",
        errors: [],
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        assignedAgentId: agentId,
        status: BOOKING_STATUS.ASSIGNED,
        assignedAt: new Date(),
        agentPayout,
        adminMargin: Number((total - agentPayout).toFixed(2)),
      },
      include: {
        package: true,
        assignedAgent: {
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

    return ok(res, "Agent assigned and notified", updated);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to assign booking",
      errors: [],
    });
  }
}

async function updateBookingStatus(req, res) {
  const parsed = adminBookingStatusSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        package: true,
        assignedAgent: {
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

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found", errors: [] });
    }

    const nextStatus = parsed.data.status;
    const now = new Date();
    const financials = financialBreakdown(Number(booking.totalAmount || 0));
    const updateData = {
      status: nextStatus,
      agentDecisionRemark: parsed.data.decision_remark,
      agentRejectionReason: parsed.data.rejection_reason,
    };

    if (nextStatus === BOOKING_STATUS.CONFIRMED) {
      updateData.confirmedAt = booking.confirmedAt || now;
    }

    if (nextStatus === BOOKING_STATUS.OPEN_FOR_AGENTS) {
      updateData.confirmedAt = booking.confirmedAt || now;
      updateData.publishedAt = booking.publishedAt || now;
    }

    if (nextStatus === BOOKING_STATUS.ASSIGNED) {
      const agentId = String(parsed.data.agent_id || booking.assignedAgentId || "").trim();
      if (!agentId) {
        return res.status(400).json({ success: false, message: "agent_id is required when assigning a booking", errors: [] });
      }

      const optedIn = await prisma.packageInterest.findFirst({
        where: {
          packageId: booking.packageId,
          agentId,
        },
      });

      if (!optedIn) {
        return res.status(400).json({ success: false, message: "Selected agent has not opted in for this package", errors: [] });
      }

      updateData.assignedAgentId = agentId;
      updateData.assignedAt = booking.assignedAt || now;
      updateData.agentPayout = financials.payout;
      updateData.adminMargin = Number((financials.commission + financials.gst).toFixed(2));
      updateData.confirmedAt = booking.confirmedAt || now;
      updateData.publishedAt = booking.publishedAt || now;
    }

    if (nextStatus === BOOKING_STATUS.ACCEPTED) {
      updateData.acceptedAt = booking.acceptedAt || now;
    }

    if (nextStatus === BOOKING_STATUS.IN_PROGRESS) {
      updateData.acceptedAt = booking.acceptedAt || now;
    }

    if (nextStatus === BOOKING_STATUS.COMPLETED) {
      updateData.completedAt = now;
    }

    if (nextStatus === BOOKING_STATUS.CLOSED) {
      updateData.closedAt = now;
    }

    if (nextStatus === BOOKING_STATUS.CANCELLED) {
      updateData.rejectedAt = now;
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: updateData,
      include: {
        package: true,
        assignedAgent: {
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

    return ok(res, "Booking status updated successfully", updated);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      errors: [],
    });
  }
}

async function listAllBookings(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const search = String(req.query.search || "").trim();
  const bookingId = String(req.query.booking_id || req.query.id || "").trim();
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

  if (bookingId) {
    where.id = bookingId;
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
          assignedAgent: {
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
          applications: {
            select: {
              id: true,
              status: true,
              agentId: true,
            },
          },
          transaction: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const enrichedItems = items.map((booking) => ({
      ...booking,
      financials: financialBreakdown(booking.totalAmount),
      application_count: booking.applications.length,
      selected_application_id:
        booking.applications.find((application) => application.status === "selected")?.id || null,
    }));

    return ok(res, "Admin bookings fetched successfully", {
      items: enrichedItems,
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

async function publishBookingToAgents(req, res) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found", errors: [] });
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: "Only confirmed bookings can be published to agents",
        errors: [],
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.OPEN_FOR_AGENTS,
        publishedAt: new Date(),
      },
      include: {
        package: true,
      },
    });

    return ok(res, "Booking published for agent applications", updated);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to publish booking",
      errors: [],
    });
  }
}

async function listBookingApplications(req, res) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found", errors: [] });
    }

    const [interests, allBookings] = await Promise.all([
      prisma.packageInterest.findMany({
        where: { packageId: booking.packageId },
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        select: {
          id: true,
          assignedAgentId: true,
          status: true,
          feedbackRating: true,
        },
      }),
    ]);

    const statsByAgent = new Map();

    for (const item of allBookings) {
      if (!item.assignedAgentId) {
        continue;
      }

      if (!statsByAgent.has(item.assignedAgentId)) {
        statsByAgent.set(item.assignedAgentId, {
          completedTrips: 0,
          activeTrips: 0,
          ratingSum: 0,
          ratingCount: 0,
        });
      }

      const stats = statsByAgent.get(item.assignedAgentId);
      if ([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.ASSIGNED].includes(item.status)) {
        stats.activeTrips += 1;
      }
      if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CLOSED].includes(item.status)) {
        stats.completedTrips += 1;
      }
      if (typeof item.feedbackRating === "number") {
        stats.ratingSum += item.feedbackRating;
        stats.ratingCount += 1;
      }
    }

    const items = interests.map((interest) => {
      const agentStats = statsByAgent.get(interest.agentId) || {
        completedTrips: 0,
        activeTrips: 0,
        ratingSum: 0,
        ratingCount: 0,
      };

      const rating = agentStats.ratingCount
        ? Number((agentStats.ratingSum / agentStats.ratingCount).toFixed(2))
        : 4.5;

      return {
        ...interest,
        agentProfile: {
          id: interest.agent.id,
          name: interest.agent.user.name,
          email: interest.agent.user.email,
          phone: interest.agent.contactNumber,
          city: interest.agent.agencyName,
          expertise: interest.agent.bio,
          rating,
          ratingPercent: Number((rating * 20).toFixed(0)),
          tripAssignedCount: interest.agent.tripAssignedCount,
          tripAcceptedCount: interest.agent.tripAcceptedCount,
          tripRejectedCount: interest.agent.tripRejectedCount,
          completedTrips: agentStats.completedTrips,
          ongoingTrips: agentStats.activeTrips,
          pendingRequests: 0,
        },
      };
    });

    return ok(res, "Booking applications fetched successfully", {
      bookingId: booking.id,
      items,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking applications",
      errors: [],
    });
  }
}

async function listPackageInterests(req, res) {
  try {
    const travelPackage = await prisma.travelPackage.findUnique({
      where: { id: req.params.id },
    });

    if (!travelPackage) {
      return res.status(404).json({ success: false, message: "Package not found", errors: [] });
    }

    const [interests, allBookings] = await Promise.all([
      prisma.packageInterest.findMany({
        where: { packageId: travelPackage.id },
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        select: {
          id: true,
          assignedAgentId: true,
          status: true,
          feedbackRating: true,
        },
      }),
    ]);

    const statsByAgent = new Map();

    for (const item of allBookings) {
      if (!item.assignedAgentId) {
        continue;
      }

      if (!statsByAgent.has(item.assignedAgentId)) {
        statsByAgent.set(item.assignedAgentId, {
          completedTrips: 0,
          activeTrips: 0,
          ratingSum: 0,
          ratingCount: 0,
        });
      }

      const stats = statsByAgent.get(item.assignedAgentId);
      if ([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.ASSIGNED].includes(item.status)) {
        stats.activeTrips += 1;
      }
      if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CLOSED].includes(item.status)) {
        stats.completedTrips += 1;
      }
      if (typeof item.feedbackRating === "number") {
        stats.ratingSum += item.feedbackRating;
        stats.ratingCount += 1;
      }
    }

    const items = interests.map((interest) => {
      const agentStats = statsByAgent.get(interest.agentId) || {
        completedTrips: 0,
        activeTrips: 0,
        ratingSum: 0,
        ratingCount: 0,
      };

      const rating = agentStats.ratingCount
        ? Number((agentStats.ratingSum / agentStats.ratingCount).toFixed(2))
        : 4.5;

      return {
        ...interest,
        agentProfile: {
          id: interest.agent.id,
          name: interest.agent.user.name,
          email: interest.agent.user.email,
          phone: interest.agent.contactNumber,
          city: interest.agent.agencyName,
          expertise: interest.agent.bio,
          rating,
          ratingPercent: Number((rating * 20).toFixed(0)),
          tripAssignedCount: interest.agent.tripAssignedCount,
          tripAcceptedCount: interest.agent.tripAcceptedCount,
          tripRejectedCount: interest.agent.tripRejectedCount,
          completedTrips: agentStats.completedTrips,
          ongoingTrips: agentStats.activeTrips,
          pendingRequests: 0,
        },
      };
    });

    return ok(res, "Package interests fetched successfully", {
      packageId: travelPackage.id,
      items,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch package interests",
      errors: [],
    });
  }
}

async function selectBookingApplication(req, res) {
  try {
    const interest = await prisma.packageInterest.findUnique({
      where: { id: req.params.applicationId },
      include: {
        package: true,
        agent: true,
      },
    });

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!interest || !booking || booking.packageId !== interest.packageId) {
      return res.status(404).json({ success: false, message: "Application not found", errors: [] });
    }

    if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.OPEN_FOR_AGENTS, BOOKING_STATUS.ASSIGNED].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking is not ready for agent assignment",
        errors: [],
      });
    }

    const bookingAmount = Number(booking.totalAmount || 0);
    const financials = financialBreakdown(bookingAmount);

    const result = await prisma.$transaction(async (tx) => {
      await tx.packageInterest.update({
        where: { id: interest.id },
        data: {
          updatedAt: new Date(),
        },
      });

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          assignedAgentId: interest.agentId,
          status: BOOKING_STATUS.ASSIGNED,
          assignedAt: new Date(),
          confirmedAt: booking.confirmedAt || new Date(),
          publishedAt: booking.publishedAt || new Date(),
          agentPayout: financials.payout,
          adminMargin: Number((financials.commission + financials.gst).toFixed(2)),
        },
        include: {
          package: true,
          assignedAgent: {
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
    });

    return ok(res, "Agent application selected and booking assigned", result);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to select booking application",
      errors: [],
    });
  }
}

async function analyticsOverview(_req, res) {
  try {
    const [bookings, packages] = await Promise.all([
      prisma.booking.findMany({
        include: {
          assignedAgent: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
    const totalAgentPayout = bookings.reduce((sum, booking) => sum + Number(booking.agentPayout || 0), 0);
    const totalAdminMargin = bookings.reduce((sum, booking) => sum + Number(booking.adminMargin || 0), 0);

    const agentMap = new Map();
    const packageMap = new Map();
    const bookingTrendMap = new Map();
    const revenueTrendMap = new Map();
    const bookingStatusBreakdown = {
      pending: 0,
      confirmed: 0,
      open_for_agents: 0,
      assigned: 0,
      accepted: 0,
      rejected: 0,
      in_progress: 0,
      completed: 0,
      closed: 0,
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
      const agentId = booking.assignedAgentId || booking.package.agentId;
      const agentName = booking.assignedAgent?.user?.name || booking.package.agent?.user?.name || "Unassigned";
      const packageId = booking.package.id;
      const packageTitle = booking.package.title;
      const dateKey = booking.bookingDate.toISOString().slice(0, 10);
      const bookingStatus = String(booking.status || "").toLowerCase();
      const paymentStatus = String(booking.transaction?.status || "").toLowerCase();

      if (agentId && !agentMap.has(agentId)) {
        agentMap.set(agentId, { agent_id: agentId, agent_name: agentName, total_bookings: 0 });
      }
      if (agentId) {
        agentMap.get(agentId).total_bookings += 1;
      }

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
      total_agent_payout: Number(totalAgentPayout.toFixed(2)),
      total_admin_margin: Number(totalAdminMargin.toFixed(2)),
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
          assignedAgent: {
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    const bookingsMap = new Map();
    const revenueMap = new Map();

    for (const booking of bookings) {
      const agentId = booking.assignedAgent?.id;
      if (!agentId) {
        continue;
      }
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

async function updateBookingPayout(req, res) {
  const paidAmount = Number(req.body?.paid_amount);
  const payoutTransactionReference = String(req.body?.payout_transaction_reference || "").trim();

  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    return res.status(400).json({
      success: false,
      message: "paid_amount must be zero or positive",
      errors: [],
    });
  }

  if (!payoutTransactionReference) {
    return res.status(400).json({
      success: false,
      message: "payout_transaction_reference is required",
      errors: [],
    });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        agentPayout: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found", errors: [] });
    }

    const targetPayout = Number(booking.agentPayout || 0);
    if (targetPayout <= 0) {
      return res.status(400).json({
        success: false,
        message: "Booking has no payable agent payout",
        errors: [],
      });
    }

    if (paidAmount > targetPayout) {
      return res.status(400).json({
        success: false,
        message: "paid_amount cannot exceed agent payout",
        errors: [],
      });
    }

    const payoutStatus = paidAmount === 0 ? "unpaid" : paidAmount >= targetPayout ? "paid" : "partial";

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        payoutStatus,
        payoutPaidAmount: paidAmount,
        payoutTransactionReference,
        payoutPaidAt: paidAmount > 0 ? new Date() : null,
      },
      include: {
        package: true,
        assignedAgent: {
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

    return ok(res, "Booking payout updated successfully", updated);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update booking payout",
      errors: [],
    });
  }
}

// ────────── PACKAGE MANAGEMENT ──────────

async function getPackageById(req, res) {
  try {
    const travelPackage = await prisma.travelPackage.findUnique({
      where: { id: req.params.id },
      include: {
        agent: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        itineraries: { orderBy: { dayNumber: "asc" } },
        pricingOptions: { orderBy: { price: "asc" } },
        departures: { orderBy: { departureDate: "asc" }, where: { isActive: true } },
        inclusions: true,
        addOns: true,
        _count: { select: { bookings: true } },
      },
    });

    if (!travelPackage) {
      return res.status(404).json({ success: false, message: "Package not found", errors: [] });
    }

    const ratingAgg = await prisma.booking.aggregate({
      where: { packageId: travelPackage.id, feedbackRating: { not: null } },
      _avg: { feedbackRating: true },
      _count: true,
    });

    const rating = ratingAgg._avg.feedbackRating
      ? Number(Number(ratingAgg._avg.feedbackRating).toFixed(2))
      : null;

    return ok(res, "Package fetched successfully", {
      ...travelPackage,
      rating,
      reviewCount: ratingAgg._count,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch package", errors: [] });
  }
}

const updatePackageSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  destination: z.string().optional(),
  durationDays: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  category: z.string().optional(),
  bannerImage: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  featuredRank: z.number().int().positive().optional().nullable(),
  itineraries: z.array(z.object({
    dayNumber: z.number().int().positive(),
    title: z.string(),
    description: z.string().nullable().optional(),
    morningActivity: z.string().nullable().optional(),
    afternoonActivity: z.string().nullable().optional(),
    eveningActivity: z.string().nullable().optional(),
    nightActivity: z.string().nullable().optional(),
    locations: z.union([z.array(z.string()), z.string()]).optional().transform(val => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val || [];
    }),
    activities: z.union([z.array(z.string()), z.string()]).optional().transform(val => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val || [];
    }),
  })).optional(),
  pricingOptions: z.array(z.object({
    roomType: z.string(),
    price: z.number().positive(),
  })).optional(),
  departures: z.array(z.object({
    departureDate: z.string(),
    availableSeats: z.number().int().positive(),
    price: z.number().positive(),
    isActive: z.boolean().optional(),
  })).optional(),
  inclusions: z.array(z.object({
    type: z.enum(["inclusion", "exclusion"]),
    description: z.string(),
  })).optional(),
  addOns: z.array(z.object({
    title: z.string(),
    description: z.string().optional().nullable(),
    price: z.number().positive(),
  })).optional(),
});

async function updatePackage(req, res) {
  const parsed = updatePackageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.issues });
  }

  const { itineraries, pricingOptions, departures, inclusions, addOns, ...topLevel } = parsed.data;

  try {
    const existing = await prisma.travelPackage.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Package not found", errors: [] });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.travelPackage.update({
        where: { id: req.params.id },
        data: topLevel,
      });

      if (itineraries !== undefined) {
        await tx.packageItinerary.deleteMany({ where: { packageId: req.params.id } });
        for (const it of itineraries) {
          await tx.packageItinerary.create({
            data: {
              packageId: req.params.id,
              dayNumber: it.dayNumber,
              title: it.title,
              description: it.description || "",
              morningActivity: it.morningActivity || "",
              afternoonActivity: it.afternoonActivity || "",
              eveningActivity: it.eveningActivity || "",
              nightActivity: it.nightActivity || "",
              locations: it.locations || [],
              activities: it.activities || [],
            },
          });
        }
      }

      if (pricingOptions !== undefined) {
        await tx.packagePricingOption.deleteMany({ where: { packageId: req.params.id } });
        for (const po of pricingOptions) {
          await tx.packagePricingOption.create({
            data: { packageId: req.params.id, roomType: po.roomType, price: po.price },
          });
        }
      }

      if (departures !== undefined) {
        await tx.packageDeparture.deleteMany({ where: { packageId: req.params.id } });
        for (const d of departures) {
          await tx.packageDeparture.create({
            data: {
              packageId: req.params.id,
              departureDate: new Date(d.departureDate),
              availableSeats: d.availableSeats,
              bookedSeats: 0,
              price: d.price,
              isActive: d.isActive !== false,
            },
          });
        }
      }

      if (inclusions !== undefined) {
        await tx.packageInclusion.deleteMany({ where: { packageId: req.params.id } });
        for (const inc of inclusions) {
          await tx.packageInclusion.create({
            data: { packageId: req.params.id, type: inc.type, description: inc.description },
          });
        }
      }

      if (addOns !== undefined) {
        await tx.packageAddOn.deleteMany({ where: { packageId: req.params.id } });
        for (const ao of addOns) {
          await tx.packageAddOn.create({
            data: {
              packageId: req.params.id,
              title: ao.title,
              description: ao.description || "",
              price: ao.price,
            },
          });
        }
      }

      return updated;
    });

    const enriched = await prisma.travelPackage.findUnique({
      where: { id: req.params.id },
      include: {
        itineraries: { orderBy: { dayNumber: "asc" } },
        pricingOptions: { orderBy: { price: "asc" } },
        departures: { orderBy: { departureDate: "asc" } },
        inclusions: true,
        addOns: true,
        _count: { select: { bookings: true } },
      },
    });

    return ok(res, "Package updated successfully", enriched);
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to update package", errors: [] });
  }
}

async function featurePackage(req, res) {
  const rank = req.body?.featured_rank;
  if (rank !== null && rank !== undefined && (typeof rank !== "number" || !Number.isInteger(rank) || rank < 1 || rank > 7)) {
    return res.status(400).json({ success: false, message: "featured_rank must be an integer between 1 and 7, or null", errors: [] });
  }

  try {
    // If assigning a rank, check for duplicates
    if (rank !== null && rank !== undefined) {
      const conflict = await prisma.travelPackage.findFirst({
        where: { featuredRank: rank, id: { not: req.params.id } },
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: `Rank #${rank} is already assigned to "${conflict.title}"`, errors: [] });
      }

      // Count existing featured (excluding this package if it's already featured)
      const currentFeatured = await prisma.travelPackage.count({
        where: { featuredRank: { not: null }, id: { not: req.params.id } },
      });
      if (currentFeatured >= 7) {
        return res.status(409).json({ success: false, message: "Maximum 7 featured packages allowed. Remove one first.", errors: [] });
      }
    }
    const updated = await prisma.travelPackage.update({
      where: { id: req.params.id },
      data: { featuredRank: rank },
    });

    return ok(res, rank ? `Package ranked #${rank}` : "Package removed from featured", updated);
  } catch (_error) {
    if (_error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Package not found", errors: [] });
    }
    return res.status(500).json({ success: false, message: "Failed to update featured rank", errors: [] });
  }
}

async function togglePackageActive(req, res) {
  const isActive = Boolean(req.body?.is_active);
  try {
    const updated = await prisma.travelPackage.update({
      where: { id: req.params.id },
      data: { isActive },
    });
    return ok(res, isActive ? "Package activated" : "Package deactivated", updated);
  } catch (_error) {
    if (_error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Package not found", errors: [] });
    }
    return res.status(500).json({ success: false, message: "Failed to update package status", errors: [] });
  }
}

// ────────── PACKAGE ANALYTICS ──────────

async function listPackageHistory(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const [bookings, total, stats] = await Promise.all([
      prisma.booking.findMany({
        where: { packageId: req.params.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignedAgent: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          transaction: { select: { id: true, status: true, amount: true } },
        },
      }),
      prisma.booking.count({ where: { packageId: req.params.id } }),
      prisma.booking.aggregate({
        where: { packageId: req.params.id },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    const completedCount = await prisma.booking.count({
      where: { packageId: req.params.id, status: { in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CLOSED] } },
    });

    return ok(res, "Package history fetched successfully", {
      items: bookings,
      pagination: { page, limit, total },
      analytics: {
        totalBookings: stats._count,
        totalRevenue: Number(stats._sum.totalAmount || 0),
        completionRate: stats._count ? Number(((completedCount / stats._count) * 100).toFixed(1)) : 0,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch package history", errors: [] });
  }
}

async function listPackageAgents(req, res) {
  try {
    const [interests, allBookings] = await Promise.all([
      prisma.packageInterest.findMany({
        where: { packageId: req.params.id },
        include: {
          agent: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        where: { packageId: req.params.id },
        select: { assignedAgentId: true, status: true, feedbackRating: true },
      }),
    ]);

    const statsByAgent = new Map();
    for (const b of allBookings) {
      if (!b.assignedAgentId) continue;
      if (!statsByAgent.has(b.assignedAgentId)) {
        statsByAgent.set(b.assignedAgentId, { completedTrips: 0, activeTrips: 0, ratingSum: 0, ratingCount: 0, rejectionCount: 0 });
      }
      const s = statsByAgent.get(b.assignedAgentId);
      if ([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.ASSIGNED].includes(b.status)) s.activeTrips++;
      if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CLOSED].includes(b.status)) s.completedTrips++;
      if ([BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(b.status)) s.rejectionCount++;
      if (b.feedbackRating) { s.ratingSum += b.feedbackRating; s.ratingCount++; }
    }

    const items = interests.map((i) => {
      const s = statsByAgent.get(i.agentId) || { completedTrips: 0, activeTrips: 0, ratingSum: 0, ratingCount: 0, rejectionCount: 0 };
      return {
        ...i,
        agent: {
          id: i.agent.id,
          name: i.agent.user.name,
          email: i.agent.user.email,
          contactNumber: i.agent.contactNumber,
          rating: s.ratingCount ? Number((s.ratingSum / s.ratingCount).toFixed(2)) : null,
          completedTrips: s.completedTrips,
          activeTrips: s.activeTrips,
          rejectionCount: s.rejectionCount,
        },
      };
    });

    return ok(res, "Package agents fetched successfully", { items });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch package agents", errors: [] });
  }
}

async function listPackageReviews(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const where = { packageId: req.params.id, feedbackRating: { not: null } };

    const [reviews, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { feedbackSubmittedAt: "desc" },
        select: {
          id: true,
          feedbackRating: true,
          feedbackComment: true,
          feedbackSubmittedAt: true,
          customer: { select: { id: true, name: true, email: true } },
          assignedAgent: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const avgAgg = await prisma.booking.aggregate({
      where,
      _avg: { feedbackRating: true },
    });

    return ok(res, "Package reviews fetched successfully", {
      items: reviews,
      pagination: { page, limit, total },
      averageRating: avgAgg._avg.feedbackRating
        ? Number(Number(avgAgg._avg.feedbackRating).toFixed(2))
        : null,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch package reviews", errors: [] });
  }
}

// ────────── PROFILE ENDPOINTS ──────────

async function getUserById(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found", errors: [] });
    }

    const [bookings, bookingAgg] = await Promise.all([
      prisma.booking.findMany({
        where: { customerId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          package: { select: { id: true, title: true, destination: true } },
          assignedAgent: {
            include: { user: { select: { id: true, name: true } } },
          },
          transaction: { select: { id: true, status: true, amount: true } },
        },
      }),
      prisma.booking.aggregate({
        where: { customerId: user.id },
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    return ok(res, "User profile fetched successfully", {
      user,
      totalBookings: bookingAgg._count,
      totalSpent: Number(bookingAgg._sum.totalAmount || 0),
      bookings,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch user profile", errors: [] });
  }
}

async function getAgentById(req, res) {
  try {
    const agent = await prisma.agentProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { packages: true } },
      },
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found", errors: [] });
    }

    const [bookings, bookingAgg] = await Promise.all([
      prisma.booking.findMany({
        where: { assignedAgentId: agent.id },
        orderBy: { createdAt: "desc" },
        include: {
          package: { select: { id: true, title: true, destination: true } },
          customer: { select: { id: true, name: true, email: true } },
          transaction: { select: { id: true, status: true, amount: true } },
        },
      }),
      prisma.booking.aggregate({
        where: { assignedAgentId: agent.id },
        _sum: { totalAmount: true, agentPayout: true },
      }),
    ]);

    const activeBookings = bookings.filter((b) =>
      [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.IN_PROGRESS].includes(b.status),
    ).length;

    const completedBookings = bookings.filter((b) =>
      [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CLOSED].includes(b.status),
    ).length;

    const rejectedBookings = bookings.filter((b) =>
      [BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(b.status),
    ).length;

    const rating = bookings
      .filter((b) => b.feedbackRating)
      .reduce((sum, b, _, arr) => sum + b.feedbackRating / arr.length, 0);

    return ok(res, "Agent profile fetched successfully", {
      id: agent.id,
      userId: agent.user.id,
      name: agent.user.name,
      email: agent.user.email,
      contactNumber: agent.contactNumber,
      agencyName: agent.agencyName,
      bio: agent.bio,
      isVerified: agent.isVerified,
      rating: rating || null,
      packagesCount: agent._count.packages,
      totalBookings: bookings.length,
      activeBookings,
      completedBookings,
      rejectedBookings,
      totalRevenue: Number(bookingAgg._sum.totalAmount || 0),
      totalPayout: Number(bookingAgg._sum.agentPayout || 0),
      bookings,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch agent profile", errors: [] });
  }
}

module.exports = {
  listAllBookings,
  analyticsOverview,
  listAllPackages,
  listAllAgents,
  listAllCustomers,
  listAllTransactions,
  confirmBooking,
  updateBookingStatus,
  publishBookingToAgents,
  assignBookingAgent,
  listBookingApplications,
  listPackageInterests,
  selectBookingApplication,
  updateBookingPayout,
  getPackageById,
  updatePackage,
  featurePackage,
  togglePackageActive,
  listPackageHistory,
  listPackageAgents,
  listPackageReviews,
  getUserById,
  getAgentById,
};
