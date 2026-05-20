-- CreateTable
CREATE TABLE "registration_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registration_otps_email_idx" ON "registration_otps"("email");
