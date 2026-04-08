import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientSecrets1743192000000 implements MigrationInterface {
  name = 'AddClientSecrets1743192000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "client_secrets" (
        "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
        "accountId"   uuid                     NOT NULL,
        "label"       character varying(255)   NOT NULL,
        "keyHash"     text                     NOT NULL,
        "keyPrefix"   character varying(32)    NOT NULL,
        "lastUsedAt"  timestamptz              DEFAULT NULL,
        "createdAt"   timestamptz              NOT NULL DEFAULT now(),
        CONSTRAINT "pk_client_secrets" PRIMARY KEY ("id"),
        CONSTRAINT "fk_client_secrets_account"
          FOREIGN KEY ("accountId")
          REFERENCES "accounts"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_client_secrets_account_id" ON "client_secrets" ("accountId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_client_secrets_key_prefix" ON "client_secrets" ("keyPrefix")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "client_secrets"`);
  }
}
