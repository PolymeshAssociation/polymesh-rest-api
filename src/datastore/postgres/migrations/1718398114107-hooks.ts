import { MigrationInterface, QueryRunner } from 'typeorm';

export class Hooks1718398114107 implements MigrationInterface {
  name = 'Hooks1718398114107';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "subscription" ("id" SERIAL NOT NULL, "eventType" text NOT NULL, "eventScope" text NOT NULL, "webhookUrl" text NOT NULL, "ttl" integer NOT NULL, "status" text NOT NULL, "triesLeft" integer NOT NULL, "nextNonce" integer NOT NULL, "legitimacySecret" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "subscription"');
  }
}
