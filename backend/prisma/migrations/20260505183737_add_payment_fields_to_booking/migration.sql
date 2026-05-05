/*
  Warnings:

  - You are about to drop the column `assignedAt` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "assignedAt",
ADD COLUMN     "paymentDetails" JSONB,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;
