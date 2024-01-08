import { MigrationInterface, QueryRunner } from 'typeorm';

export class Offline1704924533614 implements MigrationInterface {
  name = 'Offline1704924533614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "offline_event" DROP COLUMN "topicName"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "offline_event" ADD "topicName" text NOT NULL');
  }
}
