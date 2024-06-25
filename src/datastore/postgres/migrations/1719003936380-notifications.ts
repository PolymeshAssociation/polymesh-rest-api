import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1719003936380 implements MigrationInterface {
  name = 'Notifications1719003936380';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."idx_address_nonce"');
    await queryRunner.query(
      'CREATE TABLE "notification" ("id" SERIAL NOT NULL, "subscriptionId" integer NOT NULL, "eventId" integer NOT NULL, "triesLeft" integer NOT NULL, "status" text NOT NULL, "nonce" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "notification"');
    await queryRunner.query(
      'CREATE INDEX "idx_address_nonce" ON "offline_tx" ("address", "nonce") '
    );
  }
}
