/**
 * One-time cleanup script:
 * 1. Mark orphaned "initiated" transactions (no bookingId, no matching success transaction)
 *    as "failed" — these are abandoned Razorpay orders where the user never completed payment.
 * 2. Mark transactions linked to cancelled bookings as "refunded".
 *
 * Run: node prisma/fixTransactions.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ── Transactions for cancelled bookings → refunded ───────────────────────────
  const cancelledBookings = await prisma.booking.findMany({
    where: { status: 'cancelled' },
    select: { id: true },
  });
  const cancelledIds = cancelledBookings.map((b) => b.id);

  if (cancelledIds.length > 0) {
    const refunded = await prisma.transaction.updateMany({
      where: {
        bookingId: { in: cancelledIds },
        status: 'success',
      },
      data: { status: 'refunded' },
    });
    console.log(`✓ Marked ${refunded.count} transactions for cancelled bookings as refunded`);
  } else {
    console.log('✓ No cancelled bookings found — nothing to refund');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
