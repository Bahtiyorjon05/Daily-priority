-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardedAt" TIMESTAMP(3);

-- Backfill: every account that already exists predates onboarding, so mark it
-- complete. Without this, all current users would be pushed through a first-run
-- flow on their next visit.
UPDATE "users" SET "onboardedAt" = "createdAt" WHERE "onboardedAt" IS NULL;
