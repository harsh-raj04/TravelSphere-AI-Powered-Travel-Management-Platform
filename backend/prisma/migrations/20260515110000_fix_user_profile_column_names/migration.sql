-- Drop incorrect snake_case columns and unique index from previous migration
DROP INDEX IF EXISTS "users_referral_code_key";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "date_of_birth",
  DROP COLUMN IF EXISTS "travel_preferences",
  DROP COLUMN IF EXISTS "emergency_contact",
  DROP COLUMN IF EXISTS "notification_prefs",
  DROP COLUMN IF EXISTS "privacy_settings",
  DROP COLUMN IF EXISTS "referral_code";

-- Add correct camelCase columns (matching Prisma's naming convention)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "travelPreferences" JSONB,
  ADD COLUMN IF NOT EXISTS "emergencyContact" JSONB,
  ADD COLUMN IF NOT EXISTS "notificationPrefs" JSONB,
  ADD COLUMN IF NOT EXISTS "privacySettings" JSONB,
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
