-- Quran reading position and daily log.
--
-- QuranProgress is one row per user: a bookmark (surah + ayah + page) plus a
-- monotonic pagesRead total, kept separate so re-reading a surah or jumping to
-- Yaseen on a Friday cannot make overall progress go backwards.
--
-- QuranReadingLog is one row per calendar day, because a streak is a question
-- about days rather than position -- four pages in one sitting is one day, and a
-- missed day cannot be reconstructed from a bookmark.
CREATE TABLE "quran_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastSurah" INTEGER NOT NULL DEFAULT 1,
    "lastAyah" INTEGER NOT NULL DEFAULT 1,
    "lastPage" INTEGER NOT NULL DEFAULT 1,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quran_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quran_progress_userId_key" ON "quran_progress"("userId");

CREATE TABLE "quran_reading_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pages" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quran_reading_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quran_reading_log_userId_date_key" ON "quran_reading_log"("userId", "date");
CREATE INDEX "quran_reading_log_userId_date_idx" ON "quran_reading_log"("userId", "date" DESC);

ALTER TABLE "quran_progress" ADD CONSTRAINT "quran_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quran_reading_log" ADD CONSTRAINT "quran_reading_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
