import { ValueProvider } from '@nestjs/common';
import * as dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';

import { readPostgresConfig } from '~/datastore/datastore.utils';

dotenv.config(); // call dotenv for when the typeORM CLI is using this, normally NestJS calls dotenv for us

export const pgConfig = readPostgresConfig();

export let dataSource: DataSource;
export let dataSourceProvider: ValueProvider;
export const PG_SOURCE = 'PG_SOURCE';

if (pgConfig) {
  const migrations = [path.join(__dirname, 'migrations/*.{ts,js}')];
  const entities = [path.join(__dirname, 'entities/*.entity.{ts,js}')];

  dataSource = new DataSource({
    ...pgConfig,
    entities,
    migrations,
  });

  dataSource.initialize();

  dataSourceProvider = {
    useValue: dataSource,
    provide: PG_SOURCE,
  };
}
