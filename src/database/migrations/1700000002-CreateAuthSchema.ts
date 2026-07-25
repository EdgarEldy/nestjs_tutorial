import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the authentication and authorization tables: users, roles,
 * permissions, the two join tables (role_user, role_permission), and the three
 * token tables (activation_tokens, blacklisted_tokens, password_reset_tokens).
 * This migration depends on 1700000001-CreateCoreSchema having been run first.
 */
export class CreateAuthSchema1700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"        SERIAL      NOT NULL,
        "role_name" VARCHAR(50) NOT NULL,
        CONSTRAINT "PK_roles"         PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_name"    UNIQUE ("role_name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"       SERIAL      NOT NULL,
        "resource" VARCHAR(50) NOT NULL,
        "action"   VARCHAR(50) NOT NULL,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"             SERIAL       NOT NULL,
        "first_name"     VARCHAR(50)  NOT NULL,
        "last_name"      VARCHAR(100) NOT NULL,
        "email"          VARCHAR(100) NOT NULL,
        "password"       VARCHAR(255),
        "enabled"        BOOLEAN      NOT NULL DEFAULT false,
        "account_locked" BOOLEAN      NOT NULL DEFAULT false,
        CONSTRAINT "PK_users"       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_user" (
        "user_id" INTEGER NOT NULL,
        "role_id" INTEGER NOT NULL,
        CONSTRAINT "PK_role_user" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "FK_role_user_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_user_role"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permission" (
        "role_id"       INTEGER NOT NULL,
        "permission_id" INTEGER NOT NULL,
        CONSTRAINT "PK_role_permission" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permission_role"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permission_permission"
          FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "activation_tokens" (
        "id"           SERIAL                    NOT NULL,
        "token"        VARCHAR(255),
        "created_at"   TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT now(),
        "expires_at"   TIMESTAMP WITH TIME ZONE,
        "validated_at" TIMESTAMP WITH TIME ZONE,
        "user_id"      INTEGER                   NOT NULL,
        CONSTRAINT "PK_activation_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_activation_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "blacklisted_tokens" (
        "id"             SERIAL                   NOT NULL,
        "token"          VARCHAR(768)             NOT NULL,
        "jti"            VARCHAR(255),
        "blacklisted_at" TIMESTAMP WITH TIME ZONE,
        "created_at"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at"     TIMESTAMP WITH TIME ZONE,
        "validated_at"   TIMESTAMP WITH TIME ZONE,
        "user_id"        INTEGER,
        CONSTRAINT "PK_blacklisted_tokens"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blacklisted_tokens_jti" UNIQUE ("jti"),
        CONSTRAINT "FK_blacklisted_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id"          SERIAL                   NOT NULL,
        "token"       VARCHAR(255)             NOT NULL,
        "type"        VARCHAR(255)             NOT NULL,
        "expiry_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "user_id"     INTEGER                  NOT NULL,
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blacklisted_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activation_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permission"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}
