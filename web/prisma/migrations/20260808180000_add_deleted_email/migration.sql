-- Frees a closed account's address for re-registration without deleting the
-- record. "email" is unique, so a soft-deleted row would otherwise squat on the
-- address and the person could never sign up again. On re-registration `email`
-- becomes a tombstone and the real address moves here.
ALTER TABLE "users" ADD COLUMN "deletedEmail" TEXT;
