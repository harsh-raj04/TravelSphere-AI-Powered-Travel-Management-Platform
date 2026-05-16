const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const prisma = new PrismaClient();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const { BOOKING_STATUS } = require('../constants/statuses');

const ok   = (res, msg, data, status = 200) => res.status(status).json({ success: true,  message: msg, data });
const fail = (res, msg, errors = [], status = 400) => res.status(status).json({ success: false, message: msg, errors });

// ─── Validation ───────────────────────────────────────────────────────────────
const createSchema = z.object({
  name:            z.string().min(2),
  email:           z.string().email(),
  phone:           z.string().optional(),
  destination:     z.string().min(2),
  departureDate:   z.string().optional(),
  duration:        z.number().int().positive().optional(),
  adults:          z.number().int().min(1).default(1),
  children:        z.number().int().min(0).default(0),
  budget:          z.string().optional(),
  tripType:        z.string().optional(),
  accommodation:   z.string().optional(),
  mealPlan:        z.string().optional(),
  transport:       z.string().optional(),
  interests:       z.array(z.string()).optional(),
  specialRequests: z.string().optional(),
});

function genRequestNumber() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CPR-${ts}-${rand}`;
}

// ── helper to enrich a request with its linked booking + agent ─────────────
async function enrichRequest(id) {
  return prisma.customPackageRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      bookings: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedAgent: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });
}

// ─── 1. Customer submits (LOGIN REQUIRED) ────────────────────────────────────
async function createRequest(req, res) {
  if (!req.user?.id) return fail(res, 'You must be logged in to submit a custom request', [], 401);

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Validation failed', parsed.error.issues);

  const data = parsed.data;
  try {
    const request = await prisma.customPackageRequest.create({
      data: {
        requestNumber:   genRequestNumber(),
        userId:          req.user.id,
        name:            data.name,
        email:           data.email,
        phone:           data.phone || null,
        destination:     data.destination,
        departureDate:   data.departureDate || null,
        duration:        data.duration || null,
        adults:          data.adults,
        children:        data.children,
        budget:          data.budget || null,
        tripType:        data.tripType || null,
        accommodation:   data.accommodation || null,
        mealPlan:        data.mealPlan || null,
        transport:       data.transport || null,
        interests:       data.interests || [],
        specialRequests: data.specialRequests || null,
      },
    });
    return ok(res, 'Request submitted successfully', { request }, 201);
  } catch (e) {
    console.error('[createRequest]', e.message);
    return fail(res, 'Failed to submit request', [], 500);
  }
}

// ─── 2. Customer views own requests ──────────────────────────────────────────
async function getMyRequests(req, res) {
  if (!req.user?.id) return fail(res, 'Unauthorized', [], 401);
  const requests = await prisma.customPackageRequest.findMany({
    where:   { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      bookings: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedAgent: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  return ok(res, 'Requests fetched', { requests });
}

// ─── 3. Admin views all requests ─────────────────────────────────────────────
async function getAllRequests(req, res) {
  const page  = Math.max(Number(req.query.page)  || 1,  1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const status = req.query.status;
  const where  = status ? { status } : {};

  const [requests, total] = await Promise.all([
    prisma.customPackageRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        bookings: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            assignedAgent: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    prisma.customPackageRequest.count({ where }),
  ]);
  return ok(res, 'Requests fetched', { requests, total, page, limit });
}

// ─── 4. Admin: set to reviewing ──────────────────────────────────────────────
async function setReviewing(req, res) {
  const { id } = req.params;
  try {
    const req_ = await prisma.customPackageRequest.findUnique({ where: { id } });
    if (!req_) return fail(res, 'Request not found', [], 404);
    if (req_.status !== 'pending') return fail(res, 'Request is not pending');
    const updated = await prisma.customPackageRequest.update({
      where: { id },
      data:  { status: 'reviewing' },
    });
    return ok(res, 'Marked as reviewing', { request: updated });
  } catch { return fail(res, 'Failed', [], 500); }
}

// ─── 5. Admin: post to agent marketplace ─────────────────────────────────────
async function postToMarketplace(req, res) {
  const { id } = req.params;
  try {
    const request = await prisma.customPackageRequest.findUnique({
      where:   { id },
      include: { bookings: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!request) return fail(res, 'Request not found', [], 404);
    if (!['pending', 'reviewing'].includes(request.status))
      return fail(res, 'Request must be pending or reviewing to post to marketplace');
    if (request.bookings.length > 0)
      return fail(res, 'Already posted to marketplace');
    if (!request.userId)
      return fail(res, 'Cannot post anonymous request to marketplace', [], 400);

    const travelDate = request.departureDate
      ? new Date(request.departureDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.booking.create({
        data: {
          customerId:     request.userId,
          customRequestId: id,
          customerName:   request.user?.name || request.name,
          contactEmail:   request.user?.email || request.email,
          contactPhone:   request.phone || null,
          travelDate,
          travelersCount: request.adults + (request.children || 0),
          totalAmount:    0,
          status:         BOOKING_STATUS.OPEN_FOR_AGENTS,
          travelMessage:  `Custom trip to ${request.destination}`,
        },
      });
      await tx.customPackageRequest.update({
        where: { id },
        data:  { status: 'open' },
      });
    });

    return ok(res, 'Posted to agent marketplace');
  } catch (e) {
    console.error('[postToMarketplace]', e.message);
    return fail(res, 'Failed to post to marketplace', [], 500);
  }
}

// ─── 6. Admin: send quote (requires agent already assigned) ──────────────────
async function sendQuote(req, res) {
  const { id } = req.params;
  const { quotedPrice, itinerary, adminNote } = req.body;

  if (!quotedPrice || isNaN(Number(quotedPrice)) || Number(quotedPrice) <= 0)
    return fail(res, 'A valid quoted price is required');
  if (!itinerary?.trim())
    return fail(res, 'Itinerary details are required before sending a quote');

  try {
    const request = await prisma.customPackageRequest.findUnique({
      where:   { id },
      include: { bookings: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
    if (!request) return fail(res, 'Request not found', [], 404);
    if (request.status !== 'agent_assigned')
      return fail(res, 'An agent must be assigned before sending a quote');

    const booking = request.bookings[0];

    await prisma.$transaction(async (tx) => {
      await tx.customPackageRequest.update({
        where: { id },
        data: {
          status:      'quoted',
          quotedPrice: Number(quotedPrice),
          itinerary:   itinerary.trim(),
          adminNote:   adminNote?.trim() || null,
        },
      });
      if (booking) {
        await tx.booking.update({
          where: { id: booking.id },
          data:  { totalAmount: Number(quotedPrice) },
        });
      }
    });

    return ok(res, 'Quote sent to customer');
  } catch (e) {
    console.error('[sendQuote]', e.message);
    return fail(res, 'Failed to send quote', [], 500);
  }
}

// ─── 7. Admin: general update (admin note only after quoting) ────────────────
async function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { adminNote } = req.body;

  try {
    const request = await prisma.customPackageRequest.update({
      where: { id },
      data: {
        ...(adminNote !== undefined ? { adminNote: adminNote || null } : {}),
      },
    });
    return ok(res, 'Request updated', { request });
  } catch {
    return fail(res, 'Request not found', [], 404);
  }
}

// ─── 8. Customer responds to quote ───────────────────────────────────────────
async function respondToRequest(req, res) {
  const { id } = req.params;
  const { action, customerNote } = req.body;

  const actionMap = { accept: 'accepted', reject: 'rejected' };
  if (!actionMap[action]) return fail(res, 'Invalid action. Must be accept or reject.');

  try {
    const existing = await prisma.customPackageRequest.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) return fail(res, 'Request not found', [], 404);
    if (existing.status !== 'quoted')
      return fail(res, 'Quote has not been sent yet, or you have already responded.');

    const request = await prisma.customPackageRequest.update({
      where: { id },
      data: {
        status:       actionMap[action],
        customerNote: customerNote || null,
      },
    });
    return ok(res, 'Response recorded', { request });
  } catch {
    return fail(res, 'Failed to update request', [], 500);
  }
}

// ─── 9. Chat messages ────────────────────────────────────────────────────────
async function getMessages(req, res) {
  const { id } = req.params;
  const isAdmin = req.user?.role === 'admin';
  const where   = isAdmin ? { id } : { id, userId: req.user.id };
  const request = await prisma.customPackageRequest.findFirst({ where });
  if (!request) return fail(res, 'Request not found', [], 404);

  const messages = await prisma.customPackageMessage.findMany({
    where:   { requestId: id },
    orderBy: { createdAt: 'asc' },
  });
  return ok(res, 'Messages fetched', { messages });
}

async function addMessage(req, res) {
  const { id } = req.params;
  const { message } = req.body;
  if (!message?.trim()) return fail(res, 'Message cannot be empty');

  const isAdmin = req.user?.role === 'admin';
  const where   = isAdmin ? { id } : { id, userId: req.user.id };
  const request = await prisma.customPackageRequest.findFirst({ where });
  if (!request) return fail(res, 'Request not found', [], 404);

  const msg = await prisma.customPackageMessage.create({
    data: { requestId: id, senderRole: isAdmin ? 'admin' : 'customer', message: message.trim() },
  });
  return ok(res, 'Message sent', { message: msg }, 201);
}

// ─── 10. Payment: create Razorpay order ──────────────────────────────────────
async function createCustomOrder(req, res) {
  const { id } = req.params;
  const request = await prisma.customPackageRequest.findFirst({
    where:   { id, userId: req.user.id, status: 'accepted' },
    include: { bookings: { take: 1, orderBy: { createdAt: 'desc' } } },
  });
  if (!request) return fail(res, 'Request not found or not in accepted state', [], 404);
  if (!request.quotedPrice) return fail(res, 'No quoted price set for this request');

  try {
    const amountInPaise = Math.round(Number(request.quotedPrice) * 100);
    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  `cpr_${Date.now()}_${id.slice(0, 8)}`,
      notes:    { custom_request_id: id, customer_id: req.user.id },
    });

    await prisma.customPackageRequest.update({
      where: { id },
      data:  { razorpayOrderId: order.id },
    });

    return ok(res, 'Order created', {
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,
      request:  { id: request.id, destination: request.destination, quotedPrice: request.quotedPrice },
    });
  } catch (e) {
    console.error('[createCustomOrder]', e.message);
    return fail(res, 'Failed to create payment order', [], 500);
  }
}

// ─── 11. Payment: verify & confirm ───────────────────────────────────────────
async function verifyCustomPayment(req, res) {
  const { id } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return fail(res, 'Missing payment fields');

  const sig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (sig !== razorpay_signature) return fail(res, 'Payment verification failed', [], 400);

  const request = await prisma.customPackageRequest.findFirst({
    where:   { id, userId: req.user.id },
    include: { bookings: { take: 1, orderBy: { createdAt: 'desc' } } },
  });
  if (!request) return fail(res, 'Request not found', [], 404);

  const existingBooking = request.bookings[0];
  if (!existingBooking) return fail(res, 'No marketplace booking found for this request', [], 404);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: existingBooking.id },
        data: {
          // ACCEPTED = customer paid + agent already assigned via marketplace (implicit acceptance)
          // This puts the booking into the agent's active section immediately
          status:           BOOKING_STATUS.ACCEPTED,
          totalAmount:      request.quotedPrice,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId:  razorpay_order_id,
          confirmedAt:      new Date(),
          acceptedAt:       new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          bookingId:            existingBooking.id,
          amount:               request.quotedPrice,
          paymentMethod:        'razorpay',
          status:               'success',
          transactionReference: razorpay_payment_id,
        },
      });

      await tx.customPackageRequest.update({
        where: { id },
        data: {
          status:            'booked',
          razorpayPaymentId: razorpay_payment_id,
          bookingId:         existingBooking.id,
        },
      });
    });

    return ok(res, 'Payment verified & booking confirmed', { booking_id: existingBooking.id });
  } catch (e) {
    console.error('[verifyCustomPayment]', e.message);
    return fail(res, 'Booking confirmation failed', [], 500);
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  setReviewing,
  postToMarketplace,
  sendQuote,
  updateRequestStatus,
  respondToRequest,
  getMessages,
  addMessage,
  createCustomOrder,
  verifyCustomPayment,
};
