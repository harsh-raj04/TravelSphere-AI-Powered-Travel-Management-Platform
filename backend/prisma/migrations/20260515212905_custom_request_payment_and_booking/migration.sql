-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "customRequestId" TEXT,
ALTER COLUMN "packageId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "custom_package_requests" ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customRequestId_fkey" FOREIGN KEY ("customRequestId") REFERENCES "custom_package_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
