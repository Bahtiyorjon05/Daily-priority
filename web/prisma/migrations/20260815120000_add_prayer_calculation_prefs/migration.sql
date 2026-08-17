-- Per-user prayer calculation settings.
--
-- asrSchool: 1 = Hanafi (default), 0 = Shafi/Maliki/Hanbali. Asr falls 40-90
-- minutes later in the Hanafi school; the app shipped hard-coded to Shafi, so
-- every existing user has been shown Asr early. Defaulting to Hanafi corrects
-- that for the Central Asian user base and the toggle covers everyone else.
--
-- calculationMethod: Aladhan method id for the Fajr/Isha twilight convention.
-- Was hard-coded to 2 (ISNA, a North American convention). 14 is the Spiritual
-- Administration of Muslims of Russia, which covers Central Asia.
ALTER TABLE "user_preferences" ADD COLUMN "asrSchool" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "user_preferences" ADD COLUMN "calculationMethod" INTEGER NOT NULL DEFAULT 14;
