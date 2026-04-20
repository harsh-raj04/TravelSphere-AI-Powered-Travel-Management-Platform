-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'assigned';
ALTER TYPE "BookingStatus" ADD VALUE 'accepted';
ALTER TYPE "BookingStatus" ADD VALUE 'rejected';
ALTER TYPE "BookingStatus" ADD VALUE 'in_progress';
ALTER TYPE "BookingStatus" ADD VALUE 'closed';

-- DropForeignKey
ALTER TABLE "travel_packages" DROP CONSTRAINT "travel_packages_agentId_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "adminMargin" DECIMAL(10,2),
ADD COLUMN     "agentDecisionRemark" TEXT,
ADD COLUMN     "agentPayout" DECIMAL(10,2),
ADD COLUMN     "agentRejectionReason" TEXT,
ADD COLUMN     "agentRequestRemark" TEXT,
ADD COLUMN     "assignedAgentId" TEXT,
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "feedbackComment" TEXT,
ADD COLUMN     "feedbackRating" INTEGER,
ADD COLUMN     "feedbackSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "travelMessage" TEXT;

-- AlterTable
ALTER TABLE "travel_packages" ADD COLUMN     "imageUrls" JSONB,
ADD COLUMN     "itinerary" JSONB,
ALTER COLUMN "agentId" DROP NOT NULL,
ALTER COLUMN "destination" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "bookings_assignedAgentId_idx" ON "bookings"("assignedAgentId");

-- AddForeignKey
ALTER TABLE "travel_packages" ADD CONSTRAINT "travel_packages_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
