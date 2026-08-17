-- Surahs a person has finished.
--
-- Progress was only ever pagesRead, a running maximum, so finishing Al-Fatiha
-- after reading Al-Baqara moved nothing and the button appeared to do nothing.
-- A completion is a fact about a surah rather than about a page number, and it
-- needs its own row to be one.
CREATE TABLE "quran_surahs_read" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "surah" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quran_surahs_read_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quran_surahs_read_userId_surah_key" ON "quran_surahs_read"("userId", "surah");
CREATE INDEX "quran_surahs_read_userId_idx" ON "quran_surahs_read"("userId");

ALTER TABLE "quran_surahs_read" ADD CONSTRAINT "quran_surahs_read_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
