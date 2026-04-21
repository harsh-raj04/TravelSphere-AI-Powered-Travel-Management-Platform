const { z } = require("zod");
const { BOOKING_STATUS } = require("../constants/statuses");
const { prisma } = require("../lib/prisma");
const { ok, fail } = require("../utils/apiResponse");

const createBookingSchema = z.object({
  package_id: z.string().min(1),
  travel_date: z.string().min(1),
  travelers_count: z.number().int().positive(),
});

const statusUpdateSchema = z.object({
  status: z.enum([
    BOOKING_STATUS.PENDING,
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED,
  ]),
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
    const pkg = await prisma.travelPackage.findFirst({
      where: {
        id: parsed.data.package_id,
        isActive: true,
      },
    });

    if (!pkg) {
      return fail(res, "Package not found", [], 404);
    }

    const totalAmount = Number(pkg.price) * parsed.data.travelers_count;

    const created = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        packageId: pkg.id,
        travelDate,
        travelersCount: parsed.data.travelers_count,
        totalAmount,
      },
    });

    return ok(res, "Booking created successfully", created, 201);
  } catch (_error) {
    return fail(res, "Failed to create booking", [], 500);
  }
}

async function myBookings(req, res) {
  try {
    const items = await prisma.booking.findMany({
      where: { customerId: req.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        travelDate: true,
        travelersCount: true,
        status: true,
        totalAmount: true,
        bookingDate: true,
        package: {
          select: {
            id: true,
            title: true,
            destination: true,
            durationDays: true,
            price: true,
          },
        },
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

    const items = await prisma.booking.findMany({
      where: {
        package: {
          agentId: agentProfile.id,
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        travelDate: true,
        travelersCount: true,
        status: true,
        totalAmount: true,
        bookingDate: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        package: {
          select: {
            id: true,
            title: true,
            destination: true,
            durationDays: true,
            price: true,
          },
        },
      },
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

      if (!agentProfile || booking.package.agentId !== agentProfile.id) {
        return fail(res, "Forbidden: booking ownership mismatch", [], 403);
      }
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: parsed.data.status,
      },
      include: {
        package: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return ok(res, "Booking status updated successfully", updated);
  } catch (_error) {
    return fail(res, "Failed to update booking status", [], 500);
  }
}

module.exports = {
  createBooking,
  myBookings,
  agentBookings,
  updateBookingStatus,
};
