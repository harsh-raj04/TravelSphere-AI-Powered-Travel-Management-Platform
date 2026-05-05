-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'open_for_agents';

-- CreateEnum
CREATE TYPE "AgentApplicationStatus" AS ENUM ('applied', 'shortlisted', 'selected', 'rejected', 'withdrawn');

-- AlterTable
ALTER TABLE "bookings"
ADD COLUMN "publishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "agent_applications" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "status" "AgentApplicationStatus" NOT NULL DEFAULT 'applied',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "selectedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),

  CONSTRAINT "agent_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_applications_bookingId_agentId_key" ON "agent_applications"("bookingId", "agentId");
CREATE INDEX "agent_applications_bookingId_status_idx" ON "agent_applications"("bookingId", "status");
CREATE INDEX "agent_applications_agentId_status_idx" ON "agent_applications"("agentId", "status");

-- AddForeignKey
ALTER TABLE "agent_applications" ADD CONSTRAINT "agent_applications_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_applications" ADD CONSTRAINT "agent_applications_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
