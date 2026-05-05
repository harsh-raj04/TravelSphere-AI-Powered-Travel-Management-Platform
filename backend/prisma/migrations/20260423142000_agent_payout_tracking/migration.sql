-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('unpaid', 'partial', 'paid');

-- AlterTable
ALTER TABLE "bookings"
ADD COLUMN "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'unpaid',
ADD COLUMN "payoutPaidAmount" DECIMAL(10,2),
ADD COLUMN "payoutTransactionReference" TEXT,
ADD COLUMN "payoutPaidAt" TIMESTAMP(3);

-- Backfill existing fully payable closed/completed bookings with unpaid status explicitly
UPDATE "bookings"
SET "payoutStatus" = 'unpaid'
WHERE "payoutStatus" IS NULL;
