-- Change the default booking status so new customer bookings are confirmed immediately.
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'confirmed';
