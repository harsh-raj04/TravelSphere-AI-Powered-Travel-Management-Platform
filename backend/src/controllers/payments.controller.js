const Razorpay = require("razorpay");
const crypto = require("crypto");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { BOOKING_STATUS } = require("../constants/statuses");
const { ok, fail } = require("../utils/apiResponse");
const { notify } = require("../services/notificationService");
const { sendBookingConfirmationEmail } = require("../services/emailService");

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
  add_on_ids: z.array(z.string()).optional().default([]),
});

async function createOrder(req, res) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", parsed.error.issues, 400);
  }

  const { package_id, departure_id, room_type, room_price, travelers, travel_date, add_on_ids } = parsed.data;

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

    // Validate and fetch add-ons from DB (never trust client prices)
    let addOnsData = [];
    if (add_on_ids.length > 0) {
      addOnsData = await prisma.packageAddOn.findMany({
        where: { id: { in: add_on_ids }, packageId: package_id },
        select: { id: true, title: true, price: true },
      });
    }

    const addOnsTotal = addOnsData.reduce((sum, ao) => sum + Number(ao.price) * travelers, 0);
    const totalAmount = room_price * travelers + addOnsTotal;
    const amountInPaise = Math.round(totalAmount * 100);

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
        add_ons: addOnsData.map(ao => ({ id: ao.id, title: ao.title, price: Number(ao.price) })),
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
    add_ons: z.array(z.object({
      id: z.string(),
      title: z.string(),
      price: z.coerce.number(),
    })).optional().default([]),
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
    // Update the initiated transaction to failed; create a fallback record if it doesn't exist
    const updated = await prisma.transaction.updateMany({
      where: { transactionReference: razorpay_order_id, status: "initiated" },
      data: { status: "failed" },
    }).catch(() => ({ count: 0 }));
    if (updated.count === 0) {
      const totalAmount = booking_details.room_price * booking_details.travelers;
      await prisma.transaction.create({
        data: {
          amount: totalAmount,
          paymentMethod: "razorpay",
          status: "failed",
          transactionReference: razorpay_payment_id,
        },
      }).catch(() => {});
    }

    // Notify admins of payment failure
    try {
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((admin) =>
          notify(admin.id, {
            type: "payment_failed",
            title: "Payment Failed",
            message: `Payment verification failed for order ${razorpay_order_id}`,
            entityId: razorpay_order_id,
            entityType: "payment",
            actionUrl: "/admin/transactions",
            priority: "high",
          })
        )
      );
    } catch (notifyErr) {
      console.error("[verifyPayment] admin notify (fail) error:", notifyErr.message);
    }

    return fail(res, "Payment verification failed — signature mismatch", [], 400);
  }

  try {
    const { package_id, departure_id, room_type, room_price, travelers, travel_date, add_ons } = booking_details;

    const [pkg, departure, customer] = await Promise.all([
      prisma.travelPackage.findUnique({ where: { id: package_id } }),
      prisma.packageDeparture.findUnique({ where: { id: departure_id } }),
      prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true } }),
    ]);

    if (!pkg || !customer) {
      return fail(res, "Package or customer not found", [], 404);
    }

    const addOnsTotal = (add_ons || []).reduce((sum, ao) => sum + ao.price * travelers, 0);
    const totalAmount = room_price * travelers + addOnsTotal;

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
            add_ons: add_ons || [],
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

      // Resolve the initiated transaction created in createOrder, or create a fresh success record
      const initiatedTx = await tx.transaction.findFirst({
        where: { transactionReference: razorpay_order_id, status: "initiated" },
      });
      if (initiatedTx) {
        await tx.transaction.update({
          where: { id: initiatedTx.id },
          data: {
            bookingId: created.id,
            status: "success",
            transactionReference: razorpay_payment_id,
            amount: totalAmount,
          },
        });
      } else {
        await tx.transaction.create({
          data: {
            bookingId: created.id,
            amount: totalAmount,
            paymentMethod: "razorpay",
            status: "success",
            transactionReference: razorpay_payment_id,
          },
        });
      }

      return created;
    });

    // Notify admins of successful payment
    try {
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
      await Promise.all(
        admins.map((admin) =>
          notify(admin.id, {
            type: "payment_received",
            title: "Payment Received",
            message: `Payment of ₹${Number(booking.totalAmount).toLocaleString("en-IN")} received for ${booking.package.title}`,
            entityId: booking.id,
            entityType: "booking",
            actionUrl: `/admin/bookings/${booking.id}`,
            priority: "normal",
          })
        )
      );
    } catch (notifyErr) {
      console.error("[verifyPayment] admin notify (success) error:", notifyErr.message);
    }

    // Send booking confirmation email to customer
    try {
      await sendBookingConfirmationEmail({
        to: booking.contactEmail || customer.email,
        customerName: booking.customerName || customer.name,
        packageTitle: booking.package.title,
        travelDate: booking.travelDate,
        totalAmount: booking.totalAmount,
        bookingId: booking.id,
      });
    } catch (emailErr) {
      console.error("[verifyPayment] confirmation email error:", emailErr.message);
    }

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
