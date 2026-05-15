-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT,
ADD COLUMN "date_of_birth" TIMESTAMP(3),
ADD COLUMN "gender" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "languages" JSONB,
ADD COLUMN "travel_preferences" JSONB,
ADD COLUMN "emergency_contact" JSONB,
ADD COLUMN "notification_prefs" JSONB,
ADD COLUMN "privacy_settings" JSONB,
ADD COLUMN "referral_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");
