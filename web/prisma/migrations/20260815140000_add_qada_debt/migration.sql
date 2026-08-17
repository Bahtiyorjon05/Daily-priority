-- Qazo: prayers owed and prayers made up, one row per prayer per user.
--
-- Two running totals rather than a row per makeup. People arrive with a debt
-- measured in months or years and no record of it, so the starting point has to
-- be a number they set themselves. Keeping "owed" and "madeUp" separate means
-- the remaining debt is an auditable subtraction, and it preserves the
-- difference between paying a debt down and correcting an estimate.
CREATE TABLE "qada_debts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prayer" TEXT NOT NULL,
    "owed" INTEGER NOT NULL DEFAULT 0,
    "madeUp" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qada_debts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qada_debts_userId_prayer_key" ON "qada_debts"("userId", "prayer");
CREATE INDEX "qada_debts_userId_idx" ON "qada_debts"("userId");

ALTER TABLE "qada_debts" ADD CONSTRAINT "qada_debts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
