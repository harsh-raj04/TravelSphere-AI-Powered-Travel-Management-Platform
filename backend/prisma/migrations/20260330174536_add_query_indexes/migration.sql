-- CreateIndex
CREATE INDEX "bookings_bookingDate_idx" ON "bookings"("bookingDate");

-- CreateIndex
CREATE INDEX "bookings_travelDate_idx" ON "bookings"("travelDate");

-- CreateIndex
CREATE INDEX "bookings_status_bookingDate_idx" ON "bookings"("status", "bookingDate");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
