/*
  Warnings:

  - You are about to drop the column `imageUrls` on the `travel_packages` table. All the data in the column will be lost.
  - You are about to drop the column `itinerary` on the `travel_packages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "travel_packages" DROP COLUMN "imageUrls",
DROP COLUMN "itinerary",
ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'group_tours';

-- CreateTable
CREATE TABLE "package_itineraries" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locations" JSONB,
    "activities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_pricing_options" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pricing_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_departures" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_departures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_inclusions" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_inclusions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_addons" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_itineraries_packageId_idx" ON "package_itineraries"("packageId");

-- CreateIndex
CREATE INDEX "package_itineraries_dayNumber_idx" ON "package_itineraries"("dayNumber");

-- CreateIndex
CREATE INDEX "package_pricing_options_packageId_idx" ON "package_pricing_options"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "package_pricing_options_packageId_roomType_key" ON "package_pricing_options"("packageId", "roomType");

-- CreateIndex
CREATE INDEX "package_departures_packageId_idx" ON "package_departures"("packageId");

-- CreateIndex
CREATE INDEX "package_departures_departureDate_idx" ON "package_departures"("departureDate");

-- CreateIndex
CREATE INDEX "package_inclusions_packageId_idx" ON "package_inclusions"("packageId");

-- CreateIndex
CREATE INDEX "package_inclusions_type_idx" ON "package_inclusions"("type");

-- CreateIndex
CREATE INDEX "package_addons_packageId_idx" ON "package_addons"("packageId");

-- CreateIndex
CREATE INDEX "travel_packages_category_idx" ON "travel_packages"("category");

-- AddForeignKey
ALTER TABLE "package_itineraries" ADD CONSTRAINT "package_itineraries_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "travel_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_pricing_options" ADD CONSTRAINT "package_pricing_options_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "travel_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_departures" ADD CONSTRAINT "package_departures_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "travel_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_inclusions" ADD CONSTRAINT "package_inclusions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "travel_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_addons" ADD CONSTRAINT "package_addons_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "travel_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
