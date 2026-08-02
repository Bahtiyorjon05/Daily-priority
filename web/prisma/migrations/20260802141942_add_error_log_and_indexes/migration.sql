-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'error',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "source" TEXT NOT NULL DEFAULT 'client',
    "url" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "context" JSONB,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_logs_lastSeenAt_idx" ON "error_logs"("lastSeenAt" DESC);

-- CreateIndex
CREATE INDEX "error_logs_resolved_lastSeenAt_idx" ON "error_logs"("resolved", "lastSeenAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "error_logs_fingerprint_key" ON "error_logs"("fingerprint");

-- CreateIndex
CREATE INDEX "habits_userId_idx" ON "habits"("userId");

-- CreateIndex
CREATE INDEX "habits_userId_frequency_idx" ON "habits"("userId", "frequency");

-- CreateIndex
CREATE INDEX "islamic_quotes_category_idx" ON "islamic_quotes"("category");
