const Razorpay = require("razorpay");
const crypto = require("crypto");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { BOOKING_STATUS } = require("../constants/statuses");
const { ok, fail } = require("../utils/apiResponse");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrderSchema = z.object({
  package_id: z.string().min(1),
  departure_id: z.string().min(1),
  room_type: z.string().min(1),
  room_price: z.coerce.number().positive(),
  travelers: z.coerce.number().int().positive(),
  travel_date: z.string().min(1),
});

async function createOrder(req, res) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  const { package_id, departure_id, room_type, room_price, travelers, travel_date } = parsed.data;

  try {
    const [pkg, departure] = await Promise.all([
      prisma.travelPackage.findUnique({ where: { id: package_id, isActive: true } }),
      prisma.packageDeparture.findUnique({ where: { id: departure_id } }),
    ]);

    if (!pkg) return fail(res, "Package not found", [], 404);
    if (!departure) return fail(res, "Departure not found", [], 404);

    const seatsLeft = departure.availableSeats - (departure.bookedSeats || 0);
    if (seatsLeft < travelers) {
      return fail(res, "Not enough seats available", [{ field: "travelers", issue: `Only ${seatsLeft} seats left` }], 400);
    }

    const amountInPaise = room_price * travelers * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${package_id.slice(0, 8)}`,
      notes: {
        package_id,
        departure_id,
        room_type,
        travelers: String(travelers),
        travel_date,
        customer_id: req.user.id,
      },
    });

    return ok(res, "Razorpay order created", {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      booking_details: {
        package_id,
        departure_id,
        room_type,
        room_price,
        travelers,
        travel_date,
      },
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return fail(res, "Payment order creation failed", [{ issue: error.message || "Unknown error" }], 500);
  }
}

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  booking_details: z.object({
    package_id: z.string().min(1),
    departure_id: z.string().min(1),
    room_type: z.string().min(1),
    room_price: z.coerce.number().positive(),
    travelers: z.coerce.number().int().positive(),
    travel_date: z.string().min(1),
  }),
});

async function verifyPayment(req, res) {
  const parsed = verifyPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_details } = parsed.data;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return fail(res, "Payment verification failed — signature mismatch", [], 400);
  }

  try {
    const { package_id, departure_id, room_type, room_price, travelers, travel_date } = booking_details;

    const [pkg, departure, customer] = await Promise.all([
      prisma.travelPackage.findUnique({ where: { id: package_id } }),
      prisma.packageDeparture.findUnique({ where: { id: departure_id } }),
      prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true } }),
    ]);

    if (!pkg || !customer) {
      return fail(res, "Package or customer not found", [], 404);
    }

    const totalAmount = room_price * travelers;

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          customerId: req.user.id,
          packageId: package_id,
          customerName: customer.name,
          contactEmail: customer.email,
          travelDate: new Date(travel_date),
          travelersCount: travelers,
          totalAmount,
          status: BOOKING_STATUS.CONFIRMED,
          confirmedAt: new Date(),
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paymentDetails: JSON.stringify({
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            room_type,
          }),
        },
        include: { package: true },
      });

      if (departure) {
        await tx.packageDeparture.update({
          where: { id: departure_id },
          data: { bookedSeats: { increment: travelers } },
        });
      }

      return created;
    });

    return ok(res, "Payment verified & booking confirmed", {
      booking_id: booking.id,
      status: booking.status,
      package: booking.package.title,
      travel_date: booking.travelDate,
      travelers: booking.travelersCount,
      total: booking.totalAmount,
    });
  } catch (error) {
    console.error("Booking creation after payment failed:", error);
    return fail(res, "Booking failed", [{ issue: error.message || "Unknown error" }], 500);
  }
}

async function getKeyId(_req, res) {
  return ok(res, "Razorpay key ID", {
    key_id: process.env.RAZORPAY_KEY_ID,
  });
}

module.exports = { createOrder, verifyPayment, getKeyId };
