import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppsSlugGloballyUnique1743184800000 implements MigrationInterface {
  name = 'AppsSlugGloballyUnique1743184800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "apps" DROP CONSTRAINT IF EXISTS "uq_apps_account_slug"`,
    );

    await queryRunner.query(`
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
      WHERE a."id" = r."id" AND r.rn > 1
    `);

    await queryRunner.query(
      `ALTER TABLE "apps" ADD CONSTRAINT "uq_apps_slug" UNIQUE ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "apps" DROP CONSTRAINT IF EXISTS "uq_apps_slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apps" ADD CONSTRAINT "uq_apps_account_slug" UNIQUE ("accountId", "slug")`,
    );
  }
}
