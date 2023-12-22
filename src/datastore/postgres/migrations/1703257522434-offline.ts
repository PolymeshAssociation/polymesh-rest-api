import { MigrationInterface, QueryRunner } from 'typeorm';

export class Offline1703257522434 implements MigrationInterface {
  name = 'Offline1703257522434';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "offline_event" ("id" SERIAL NOT NULL, "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" text NOT NULL, "body" json NOT NULL, CONSTRAINT "PK_b1a60a8a09498bfa4d195196211" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_af766de01b16222c89464aeda8" ON "offline_event" ("name") '
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_af766de01b16222c89464aeda8"');
    await queryRunner.query('DROP TABLE "offline_event"');
  }
}
