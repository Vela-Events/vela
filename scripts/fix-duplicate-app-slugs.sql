-- Run once against your DB if apps.slug has duplicates and adding UNIQUE fails
-- (e.g. after moving from per-account unique to global unique slug).
--
--   psql "$DATABASE_URL" -f scripts/fix-duplicate-app-slugs.sql
--
-- Keeps the oldest row (by createdAt) for each slug; renames others to slug-<idhex>.

BEGIN;

WITH ranked AS (
  SELECT
    "id",
    "slug",
    ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "createdAt" ASC) AS rn
  FROM "apps"
)
UPDATE "apps" AS a
SET "slug" = a."slug" || '-' || SUBSTRING(REPLACE(r."id"::text, '-', ''), 1, 12)
FROM ranked AS r
WHERE a."id" = r."id" AND r.rn > 1;

ALTER TABLE "apps" DROP CONSTRAINT IF EXISTS "uq_apps_account_slug";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_apps_slug'
  ) THEN
    ALTER TABLE "apps" ADD CONSTRAINT "uq_apps_slug" UNIQUE ("slug");
  END IF;
END $$;

COMMIT;
