-- AlterTable: add optional Spotify metadata columns to Track.
-- All nullable & additive — no data loss, no rewrite of existing rows.
-- IF NOT EXISTS keeps it idempotent (safe to re-run / re-deploy).
ALTER TABLE "Track"
  ADD COLUMN IF NOT EXISTS "explicit" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "releaseDate" TEXT,
  ADD COLUMN IF NOT EXISTS "albumType" TEXT,
  ADD COLUMN IF NOT EXISTS "label" TEXT,
  ADD COLUMN IF NOT EXISTS "copyright" TEXT,
  ADD COLUMN IF NOT EXISTS "metaSyncedAt" TIMESTAMP(3);
