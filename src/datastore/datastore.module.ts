/* istanbul ignore file */

import { DynamicModule, Module } from '@nestjs/common';

import { readPostgresConfig } from '~/datastore/datastore.utils';
import { LocalStoreModule } from '~/datastore/local-store/local-store.module';
import { PostgresModule } from '~/datastore/postgres/postgres.module';

/**
 * responsible for selecting a module to store state in
 *
 * @note defaults to LocalStoreModule
 */
@Module({})
export class DatastoreModule {
  public static register(): DynamicModule {
    const pgConfig = readPostgresConfig();

    const modules = pgConfig ? [PostgresModule] : [LocalStoreModule];

    return {
      module: DatastoreModule,
      imports: modules,
      exports: modules,
    };
  }
}
