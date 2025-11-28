/* istanbul ignore file */

import { DynamicModule, Inject, Module, OnModuleDestroy, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ConfigurableModuleClass } from '~/datastore/config.module-definition';
import { LocalStoreModule } from '~/datastore/local-store/local-store.module';
import { PostgresModule } from '~/datastore/postgres/postgres.module';
import { createDataSource } from '~/datastore/postgres/source';

/**
 * responsible for selecting a module to store state in
 *
 * @note defaults to LocalStoreModule
 */
@Module({})
export class DatastoreModule extends ConfigurableModuleClass implements OnModuleDestroy {
  constructor(@Optional() @Inject(DataSource) private readonly dataSource: DataSource) {
    super();
  }

  public static registerAsync(): DynamicModule {
    const postgresSource = createDataSource();
    if (!postgresSource) {
      return {
        module: LocalStoreModule,
        exports: [LocalStoreModule],
      };
    } else {
      return {
        providers: [
          {
            provide: DataSource,
            useFactory: async (): Promise<DataSource> => {
              await postgresSource.initialize();
              return postgresSource;
            },
          },
        ],
        module: PostgresModule,
        exports: [PostgresModule],
      };
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
