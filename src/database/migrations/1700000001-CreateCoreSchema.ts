import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the four core business tables: categories, products, customers, and
 * orders. Foreign key constraints are declared with explicit names so that the
 * down() method can drop them by name, making the migration fully reversible.
 */
export class CreateCoreSchema1700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"            SERIAL        NOT NULL,
        "category_name" VARCHAR(255)  NOT NULL,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"           SERIAL       NOT NULL,
        "product_name" VARCHAR(255) NOT NULL,
        "unit_price"   FLOAT        NOT NULL,
        "category_id"  INTEGER      NOT NULL,
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id")
          REFERENCES "categories"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id"         SERIAL       NOT NULL,
        "first_name" VARCHAR(255) NOT NULL,
        "last_name"  VARCHAR(255) NOT NULL,
        "telephone"  VARCHAR(50)  NOT NULL,
        "email"      VARCHAR(255) NOT NULL,
        "address"    VARCHAR(255) NOT NULL,
        CONSTRAINT "PK_customers"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"          SERIAL   NOT NULL,
        "quantity"    INTEGER  NOT NULL,
        "total"       FLOAT    NOT NULL,
        "customer_id" INTEGER  NOT NULL,
        "product_id"  INTEGER  NOT NULL,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_customer"
          FOREIGN KEY ("customer_id")
          REFERENCES "customers"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_product"
          FOREIGN KEY ("product_id")
          REFERENCES "products"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_customer_id" ON "orders" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_product_id" ON "orders" ("product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_product_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_customer_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_category_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
