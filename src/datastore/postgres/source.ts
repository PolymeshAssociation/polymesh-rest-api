/* istanbul ignore file */

import * as dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';

import { readPostgresConfigFromEnv } from '~/datastore/postgres/utils';

dotenv.config(); // allows this file to be used with the TypeORM CLI directly for generating and running migrations
const pgConfig = readPostgresConfigFromEnv();

export const createDataSource = (): DataSource | undefined => {
  const migrations = [path.join(__dirname, 'migrations/*.{ts,js}')];
  const entities = [path.join(__dirname, 'entities/*.entity.{ts,js}')];

  if (!pgConfig) {
    return undefined;
  }

  return new DataSource({
    ...pgConfig,
    entities,
    migrations,
  });
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const dataSource: DataSource = createDataSource()!;
