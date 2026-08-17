-- One row per day of Ramadan, per user.
--
-- Fasting and Taraweeh are separate columns because they are separate acts:
-- someone can fast without praying Taraweeh and the reverse, and one combined
-- flag would answer neither question.
--
-- Keyed on the Gregorian date, not the Ramadan day number -- the Hijri day
-- depends on a moon sighting that varies by country, so the device date is the
-- only key that cannot drift. hijriDay is kept for display only.
CREATE TABLE "ramadan_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hijriDay" INTEGER,
    "fasted" BOOLEAN NOT NULL DEFAULT false,
    "taraweeh" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ramadan_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ramadan_days_userId_date_key" ON "ramadan_days"("userId", "date");
CREATE INDEX "ramadan_days_userId_date_idx" ON "ramadan_days"("userId", "date" DESC);

ALTER TABLE "ramadan_days" ADD CONSTRAINT "ramadan_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
