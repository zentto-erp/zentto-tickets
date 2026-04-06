-- +goose Up
-- Dashboard views + race enhancements (QR code, payment tracking)

ALTER TABLE tkt.race_registration
  ADD COLUMN IF NOT EXISTS "Barcode" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "PaymentStatus" VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "PaymentRef" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "PaidAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "Email" VARCHAR(200);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tkt_racereg_barcode
  ON tkt.race_registration ("Barcode") WHERE "Barcode" IS NOT NULL;

-- +goose Down
ALTER TABLE tkt.race_registration
  DROP COLUMN IF EXISTS "Barcode",
  DROP COLUMN IF EXISTS "PaymentStatus",
  DROP COLUMN IF EXISTS "PaymentRef",
  DROP COLUMN IF EXISTS "PaidAt",
  DROP COLUMN IF EXISTS "Email";
