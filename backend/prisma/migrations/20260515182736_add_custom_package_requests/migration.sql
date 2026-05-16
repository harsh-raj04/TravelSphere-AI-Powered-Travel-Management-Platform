-- CreateTable
CREATE TABLE "custom_package_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "destination" TEXT NOT NULL,
    "departureDate" TEXT,
    "duration" INTEGER,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "budget" TEXT,
    "tripType" TEXT,
    "accommodation" TEXT,
    "mealPlan" TEXT,
    "transport" TEXT,
    "interests" JSONB,
    "specialRequests" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "quotedPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_package_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_package_requests_requestNumber_key" ON "custom_package_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "custom_package_requests_userId_idx" ON "custom_package_requests"("userId");

-- CreateIndex
CREATE INDEX "custom_package_requests_status_idx" ON "custom_package_requests"("status");

-- AddForeignKey
ALTER TABLE "custom_package_requests" ADD CONSTRAINT "custom_package_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
