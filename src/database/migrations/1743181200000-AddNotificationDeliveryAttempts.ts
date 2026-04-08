import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationDeliveryAttempts1743181200000 implements MigrationInterface {
  name = 'AddNotificationDeliveryAttempts1743181200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notification_delivery_attempts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appId" uuid NOT NULL,
        "eventId" uuid NOT NULL,
        "ruleId" uuid NOT NULL,
        "destinationId" uuid NOT NULL,
        "channel" character varying(32) NOT NULL,
        "attemptNumber" integer NOT NULL,
        "status" character varying(32) NOT NULL,
        "responseCode" integer,
        "responseBody" text,
        "errorMessage" text,
        "deliveredAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_delivery_attempts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_notification_delivery_attempts_app_created" ON "notification_delivery_attempts" ("appId", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notification_delivery_attempts_destination_created" ON "notification_delivery_attempts" ("destinationId", "createdAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_notification_delivery_attempts_destination_created"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_notification_delivery_attempts_app_created"',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS "notification_delivery_attempts"',
    );
  }
}
