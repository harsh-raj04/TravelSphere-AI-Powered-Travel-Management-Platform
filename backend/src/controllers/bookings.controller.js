const { z } = require("zod");
const { BOOKING_STATUS } = require("../constants/statuses");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

const createBookingSchema = z.object({
  package_id: z.string().min(1),
  travel_date: z.string().min(1),
  travelers_count: z.number().int().positive(),
  customer_name: z.string().min(2).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().min(8).optional(),
  travel_message: z.string().min(2).max(500).optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum([
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.IN_PROGRESS,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CLOSED,
    BOOKING_STATUS.CANCELLED,
  ]),
  rejection_reason: z.string().min(2).max(200).optional(),
  decision_remark: z.string().min(2).max(500).optional(),
});

async function createBooking(req, res) {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  const travelDate = new Date(parsed.data.travel_date);
  if (Number.isNaN(travelDate.getTime())) {
    return fail(res, "Validation failed", [{ field: "travel_date", issue: "Invalid date" }], 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const travelDateOnly = new Date(travelDate);
  travelDateOnly.setHours(0, 0, 0, 0);

  if (travelDateOnly < today) {
    return fail(res, "Validation failed", [{ field: "travel_date", issue: "Travel date must be current or future" }], 400);
  }

  try {
    const [pkg, customer] = await Promise.all([
      prisma.travelPackage.findFirst({
        where: {
          id: parsed.data.package_id,
          isActive: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true },
      }),
    ]);

    if (!pkg) {
      return fail(res, "Package not found", [], 404);
    }

    if (!customer) {
      return fail(res, "Customer not found", [], 404);
    }

    const totalAmount = Number(pkg.price) * parsed.data.travelers_count;

    const created = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        packageId: pkg.id,
        customerName: parsed.data.customer_name || customer.name,
        contactEmail: parsed.data.contact_email || customer.email,
        contactPhone: parsed.data.contact_phone,
        travelMessage: parsed.data.travel_message,
        travelDate,
        travelersCount: parsed.data.travelers_count,
        totalAmount,
      },
      include: {
        package: true,
      },
    });

    return ok(res, "Booking request created successfully", created, 201);
  } catch (_error) {
    console.error("createBooking error", _error);
    return fail(res, "Failed to create booking", [], 500);
  }
}

async function myBookings(req, res) {
  try {
    const items = await prisma.booking.findMany({
      where: {
        customerId: req.user.id,
      },
      orderBy: { createdAt: "desc" },
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
        transaction: true,
      },
    });

    return ok(res, "Customer bookings fetched successfully", {
      customerId: req.user.id,
      items,
    });
  } catch (_error) {
    return fail(res, "Failed to fetch customer bookings", [], 500);
  }
}

async function agentBookings(req, res) {
  try {
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!agentProfile) {
      return fail(res, "Agent profile not found", [], 403);
    }

    const rows = await prisma.booking.findMany({
      where: {
        assignedAgentId: agentProfile.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        package: true,
        transaction: true,
      },
    });

    const visibleStatuses = [
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.IN_PROGRESS,
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CLOSED,
    ];

    const items = rows.map((booking) => {
      const canViewCustomerContact = visibleStatuses.includes(booking.status);

      return {
        ...booking,
        customer: {
          name: booking.customerName,
          contactEmail: canViewCustomerContact ? booking.contactEmail : null,
          contactPhone: canViewCustomerContact ? booking.contactPhone : null,
        },
      };
    });

    return ok(res, "Agent bookings fetched successfully", {
      agentId: agentProfile.id,
      items,
    });
  } catch (_error) {
    return fail(res, "Failed to fetch agent bookings", [], 500);
  }
}

async function updateBookingStatus(req, res) {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  const nextStatus = parsed.data.status;

  if (req.user.role === "agent") {
    const agentAllowedStatuses = [
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.REJECTED,
      BOOKING_STATUS.IN_PROGRESS,
      BOOKING_STATUS.COMPLETED,
    ];
    if (!agentAllowedStatuses.includes(nextStatus)) {
      return fail(res, "Agents can only accept, reject, or mark in-progress", [], 403);
    }
  }

  if (req.user.role === "admin") {
    const adminAllowedStatuses = [
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CLOSED,
      BOOKING_STATUS.CANCELLED,
    ];
    if (!adminAllowedStatuses.includes(nextStatus)) {
      return fail(res, "Invalid admin status update", [], 400);
    }
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        package: true,
      },
    });

    if (!booking) {
      return fail(res, "Booking not found", [], 404);
    }

    if (req.user.role === "agent") {
      const agentProfile = await prisma.agentProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!agentProfile || booking.assignedAgentId !== agentProfile.id) {
        return fail(res, "Forbidden: booking ownership mismatch", [], 403);
      }

      if (nextStatus === BOOKING_STATUS.ACCEPTED && booking.status !== BOOKING_STATUS.ASSIGNED) {
        return fail(res, "Only assigned bookings can be accepted", [], 400);
      }

      if (nextStatus === BOOKING_STATUS.REJECTED && !parsed.data.rejection_reason && !parsed.data.decision_remark) {
        return fail(res, "Rejection reason or remark is required", [], 400);
      }

      if (nextStatus === BOOKING_STATUS.IN_PROGRESS && booking.status !== BOOKING_STATUS.ACCEPTED) {
        return fail(res, "Booking must be accepted before marking in-progress", [], 400);
      }

      if (nextStatus === BOOKING_STATUS.COMPLETED && booking.status !== BOOKING_STATUS.IN_PROGRESS) {
        return fail(res, "Booking must be in-progress before marking complete", [], 400);
      }
    }

    if (req.user.role === "admin") {
      if (
        nextStatus === BOOKING_STATUS.COMPLETED &&
        ![BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.ACCEPTED].includes(booking.status)
      ) {
        return fail(res, "Booking must be accepted or in-progress before completion", [], 400);
      }

      if (nextStatus === BOOKING_STATUS.CLOSED && booking.status !== BOOKING_STATUS.COMPLETED) {
        return fail(res, "Only completed bookings can be closed", [], 400);
      }
    }

    const now = new Date();
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: nextStatus,
        agentDecisionRemark: parsed.data.decision_remark,
        agentRejectionReason: parsed.data.rejection_reason,
        acceptedAt: nextStatus === BOOKING_STATUS.ACCEPTED ? now : undefined,
        rejectedAt: nextStatus === BOOKING_STATUS.REJECTED ? now : undefined,
        completedAt: nextStatus === BOOKING_STATUS.COMPLETED ? now : undefined,
        closedAt: nextStatus === BOOKING_STATUS.CLOSED ? now : undefined,
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

    return ok(res, "Booking status updated successfully", updated);
  } catch (_error) {
    return fail(res, "Failed to update booking status", [], 500);
  }
}

async function submitBookingFeedback(req, res) {
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return fail(res, "Rating must be an integer between 1 and 5", [], 400);
  }

  if (!comment || comment.length < 3) {
    return fail(res, "Feedback comment is required", [], 400);
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking || booking.customerId !== req.user.id) {
      return fail(res, "Booking not found", [], 404);
    }

    if (![BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CLOSED].includes(booking.status)) {
      return fail(res, "Feedback can be submitted only after trip completion", [], 400);
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        feedbackRating: rating,
        feedbackComment: comment,
        feedbackSubmittedAt: new Date(),
      },
    });

    return ok(res, "Feedback submitted successfully", updated);
  } catch (_error) {
    return fail(res, "Failed to submit feedback", [], 500);
  }
}

async function requestBookingChange(req, res) {
  const remark = String(req.body?.remark || '').trim();
  if (!remark) {
    return fail(res, 'Remark is required', [], 400);
  }

  try {
    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!agentProfile) {
      return fail(res, 'Agent profile not found', [], 403);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking || booking.assignedAgentId !== agentProfile.id) {
      return fail(res, 'Forbidden: booking ownership mismatch', [], 403);
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        agentRequestRemark: remark,
      },
    });

    return ok(res, 'Change request sent to admin', updated);
  } catch (_error) {
    return fail(res, 'Failed to request change', [], 500);
  }
}

module.exports = {
  createBooking,
  myBookings,
  agentBookings,
  updateBookingStatus,
  requestBookingChange,
  submitBookingFeedback,
};
