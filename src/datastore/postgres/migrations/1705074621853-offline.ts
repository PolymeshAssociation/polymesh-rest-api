import { MigrationInterface, QueryRunner } from 'typeorm';

export class Offline1705074621853 implements MigrationInterface {
  name = 'Offline1705074621853';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "offline_tx" ADD "address" text');
    await queryRunner.query('UPDATE "offline_tx" SET "address" = \'\' WHERE "address" IS NULL');
    await queryRunner.query('ALTER TABLE "offline_tx" ALTER COLUMN "address" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "offline_tx" ADD "nonce" integer');
    await queryRunner.query('UPDATE "offline_tx" SET "nonce" = -1 WHERE "nonce" IS NULL');
    await queryRunner.query('ALTER TABLE "offline_tx" ALTER COLUMN "nonce" SET NOT NULL');

    await queryRunner.query('CREATE INDEX idx_address_nonce ON offline_tx (address, nonce)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX idx_address_nonce');

    await queryRunner.query('ALTER TABLE "offline_tx" DROP COLUMN "nonce"');
    await queryRunner.query('ALTER TABLE "offline_tx" DROP COLUMN "address"');
  }
}
