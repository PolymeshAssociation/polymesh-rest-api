/* istanbul ignore file */

import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { IAuthGuard, PassportModule } from '@nestjs/passport';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import { createAuthGuard } from '~/auth/auth.utils';
import { ApiKeyStrategy } from '~/auth/strategies/api-key.strategy';
import { OpenStrategy } from '~/auth/strategies/open.strategy';
import { isAuthManagementEnabled } from '~/common/utils/feature-flags';
import { DatastoreModule } from '~/datastore/datastore.module';
import { UsersModule } from '~/users/users.module';

/**
 * responsible for the REST API's authentication strategies
 *
 * @note authorization has not yet been implemented - all users have full access
 * @note `AuthController` is only registered when `AUTH_MANAGEMENT_ENABLED` resolves to true
 */
@Module({})
export class AuthModule {
  /**
   * @note must only be called after `ConfigModule.forRoot` has loaded the environment, i.e. not at file import time
   */
  static register(): DynamicModule {
    const enabled = isAuthManagementEnabled();

    if (enabled) {
      new Logger(AuthModule.name).warn(
        'API key management endpoints are enabled. Make sure they are not reachable by untrusted callers'
      );
    }

    return {
      module: AuthModule,
      imports: [
        ConfigModule,
        DatastoreModule.registerAsync(),
        UsersModule.register(),
        PassportModule.register({
          session: false,
        }),
      ],
      providers: [
        AuthService,
        ApiKeyStrategy,
        OpenStrategy,
        {
          provide: APP_GUARD, // registers a global guard
          useFactory: (config: ConfigService): IAuthGuard => {
            const configuredStrategies = config.getOrThrow('AUTH_STRATEGY');
            return createAuthGuard(configuredStrategies);
          },
          inject: [ConfigService],
        },
      ],
      exports: [AuthService, PassportModule],
      controllers: enabled ? [AuthController] : [],
    };
  }
}
