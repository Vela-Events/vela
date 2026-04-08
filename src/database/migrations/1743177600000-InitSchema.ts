import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1743177600000 implements MigrationInterface {
  name = 'InitSchema1743177600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "citext"');

    await queryRunner.query(
      `CREATE TYPE "plan_enum" AS ENUM('free', 'pro', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "event_level_enum" AS ENUM('info', 'warning', 'error', 'success')`,
    );
    await queryRunner.query(
      `CREATE TYPE "integration_provider_enum" AS ENUM('slack', 'discord', 'email')`,
    );
    await queryRunner.query(
      `CREATE TYPE "integration_status_enum" AS ENUM('active', 'pending_oauth', 'error')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_destination_kind_enum" AS ENUM('slack_webhook', 'discord_webhook', 'email')`,
    );

    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" citext NOT NULL,
        "name" character varying(255) NOT NULL,
        "plan" "plan_enum" NOT NULL DEFAULT 'free',
        "appsLimit" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accounts_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "apps" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "accountId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "apiKeyHash" text NOT NULL,
        "apiKeyPrefix" character varying(32) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_apps_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_apps_account_slug" UNIQUE ("accountId", "slug"),
        CONSTRAINT "FK_apps_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_apps_account_id" ON "apps" ("accountId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "event_schemas" (
        "id" character varying(48) NOT NULL,
        "appId" uuid NOT NULL,
        "eventName" character varying(255) NOT NULL,
        "description" text,
        "fields" jsonb NOT NULL DEFAULT '[]',
        "metadataFields" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_schemas_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_event_schemas_app_event_name" UNIQUE ("appId", "eventName"),
        CONSTRAINT "FK_event_schemas_app" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "integration_connections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "accountId" uuid NOT NULL,
        "provider" "integration_provider_enum" NOT NULL,
        "status" "integration_status_enum" NOT NULL DEFAULT 'active',
        "displayName" character varying(255) NOT NULL,
        "credentialsEnc" text NOT NULL,
        "externalTeamId" character varying(255),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_integration_connections_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_integration_connections_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notification_destinations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appId" uuid NOT NULL,
        "connectionId" uuid,
        "kind" "notification_destination_kind_enum" NOT NULL,
        "label" character varying(255) NOT NULL,
        "webhookUrlEnc" text,
        "emailAddress" character varying(255),
        "verifiedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_destinations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_destinations_app" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_notification_destinations_connection" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notification_rules" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "eventName" character varying(255) NOT NULL,
        "conditions" jsonb NOT NULL DEFAULT '[]',
        "actions" jsonb NOT NULL DEFAULT '[]',
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "lastTriggeredAt" TIMESTAMPTZ,
        "triggerCount" bigint NOT NULL DEFAULT 0,
        CONSTRAINT "PK_notification_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_rules_app" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appId" uuid NOT NULL,
        "eventName" character varying(255) NOT NULL,
        "customerId" character varying(255),
        "payload" jsonb NOT NULL,
        "level" "event_level_enum" NOT NULL DEFAULT 'info',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "schemaId" character varying(48),
        "occurredAt" TIMESTAMPTZ NOT NULL,
        "ingestedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_events_app" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_events_schema" FOREIGN KEY ("schemaId") REFERENCES "event_schemas"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_events_app_time" ON "events" ("appId", "occurredAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_events_app_event_time" ON "events" ("appId", "eventName", "occurredAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_events_app_customer_time" ON "events" ("appId", "customerId", "occurredAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_events_app_customer_time"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "idx_events_app_event_time"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_events_app_time"');
    await queryRunner.query('DROP TABLE IF EXISTS "events"');
    await queryRunner.query('DROP TABLE IF EXISTS "notification_rules"');
    await queryRunner.query('DROP TABLE IF EXISTS "notification_destinations"');
    await queryRunner.query('DROP TABLE IF EXISTS "integration_connections"');
    await queryRunner.query('DROP TABLE IF EXISTS "event_schemas"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_apps_account_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "apps"');
    await queryRunner.query('DROP TABLE IF EXISTS "accounts"');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "notification_destination_kind_enum"',
    );
    await queryRunner.query('DROP TYPE IF EXISTS "integration_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "integration_provider_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "event_level_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "plan_enum"');
  }
}
