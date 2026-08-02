-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "freezesRemaining" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "freezesResetAt" TIMESTAMP(3),
ADD COLUMN     "lastFreezeUsedOn" TIMESTAMP(3);
