/* istanbul ignore file */

import { DynamicModule, Logger, Module } from '@nestjs/common';

import { isAuthManagementEnabled } from '~/common/utils/feature-flags';
import { DatastoreModule } from '~/datastore/datastore.module';
import { UsersController } from '~/users/users.controller';
import { UsersService } from '~/users/users.service';

/**
 * responsible for the REST API's users
 *
 * @note `UsersController` is only registered when `AUTH_MANAGEMENT_ENABLED` resolves to true
 */
@Module({})
export class UsersModule {
  private static dynamicModule?: DynamicModule;

  /**
   * @note memoized so every importer shares one module instance (Nest identifies dynamic modules by reference).
   *   Must only be called after `ConfigModule.forRoot` has loaded the environment, i.e. not at file import time
   */
  static register(): DynamicModule {
    if (!UsersModule.dynamicModule) {
      const enabled = isAuthManagementEnabled();

      if (enabled) {
        new Logger(UsersModule.name).warn(
          'User management endpoints are enabled. Make sure they are not reachable by untrusted callers'
        );
      }

      UsersModule.dynamicModule = {
        module: UsersModule,
        imports: [DatastoreModule.registerAsync()],
        controllers: enabled ? [UsersController] : [],
        providers: [UsersService],
        exports: [UsersService],
      };
    }

    return UsersModule.dynamicModule;
  }
}
