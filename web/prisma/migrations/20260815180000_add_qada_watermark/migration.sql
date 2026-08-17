-- Watermark for the qazo sweep: the last date already examined for missed
-- prayers. This is what makes the sweep idempotent -- without it every page load
-- would re-count the same missed prayers and the debt would climb forever.
ALTER TABLE "user_preferences" ADD COLUMN "qadaAutoThrough" TIMESTAMP(3);
