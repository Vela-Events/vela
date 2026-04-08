import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Existing databases may still have uuid-typed event_schemas.id / events.schemaId
 * from an older InitSchema. Application IDs use `sch_<timestamp>` strings.
 */
export class EventSchemaIdVarchar1743188400000 implements MigrationInterface {
  name = 'EventSchemaIdVarchar1743188400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "FK_events_schema"`,
    );

    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "schemaId" TYPE character varying(48)
      USING (
        CASE
          WHEN "schemaId" IS NULL THEN NULL
          ELSE "schemaId"::text
        END
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "event_schemas"
      ALTER COLUMN "id" TYPE character varying(48)
      USING "id"::text
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "FK_events_schema"
      FOREIGN KEY ("schemaId") REFERENCES "event_schemas"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "FK_events_schema"`,
    );

    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "schemaId" TYPE uuid
      USING "schemaId"::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "event_schemas"
      ALTER COLUMN "id" TYPE uuid
      USING "id"::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "FK_events_schema"
      FOREIGN KEY ("schemaId") REFERENCES "event_schemas"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }
}
