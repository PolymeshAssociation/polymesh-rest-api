import { MigrationInterface, QueryRunner } from 'typeorm';

export class Offline1703278323707 implements MigrationInterface {
  name = 'Offline1703278323707';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "offline_event" ("id" SERIAL NOT NULL, "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "topicName" text NOT NULL, "body" json NOT NULL, CONSTRAINT "PK_b1a60a8a09498bfa4d195196211" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "offline_tx" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "signature" text, "payload" json NOT NULL, "status" text NOT NULL, "blockHash" text, "txIndex" text, "txHash" text, CONSTRAINT "PK_4ed5be0b511df7cb0c53607ef09" PRIMARY KEY ("id"))'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "offline_tx"');
    await queryRunner.query('DROP TABLE "offline_event"');
  }
}
