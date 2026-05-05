-- CreateTable
CREATE TABLE "package_interests" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "availability" TEXT NOT NULL DEFAULT 'available',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_interests_packageId_agentId_key" ON "package_interests"("packageId", "agentId");

-- CreateIndex
CREATE INDEX "package_interests_packageId_idx" ON "package_interests"("packageId");

-- CreateIndex
CREATE INDEX "package_interests_agentId_idx" ON "package_interests"("agentId");

-- AddForeignKey
ALTER TABLE "package_interests" ADD CONSTRAINT "package_interests_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "travel_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_interests" ADD CONSTRAINT "package_interests_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
