import { MigrationInterface, QueryRunner } from 'typeorm';

export class users1666813826181 implements MigrationInterface {
  name = 'users1666813826181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" text NOT NULL, CONSTRAINT "UQ_065d4d8f3b5adb4a08841eae3c8" UNIQUE ("name"), CONSTRAINT "CHK_98ce97014728b484ea0b40feb9" CHECK (LENGTH(name) < 127), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "api_key" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "secret" text NOT NULL, "user" text NOT NULL, "userId" uuid, CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_6eecb2200c16b5e6610fe33942" ON "api_key" ("secret") '
    );
    await queryRunner.query(
      'ALTER TABLE "api_key" ADD CONSTRAINT "FK_277972f4944205eb29127f9bb6c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "api_key" DROP CONSTRAINT "FK_277972f4944205eb29127f9bb6c"'
    );
    await queryRunner.query('DROP INDEX "public"."IDX_6eecb2200c16b5e6610fe33942"');
    await queryRunner.query('DROP TABLE "api_key"');
    await queryRunner.query('DROP TABLE "user"');
  }
}
