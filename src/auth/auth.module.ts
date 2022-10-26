/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { IAuthGuard, PassportModule } from '@nestjs/passport';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import { createAuthGuard } from '~/auth/auth.utils';
import { ApiKeyStrategy } from '~/auth/strategies/api-key.strategy';
import { OpenStrategy } from '~/auth/strategies/open.strategy';
import { DatastoreModule } from '~/datastore/datastore.module';
import { UsersModule } from '~/users/users.module';

/**
 * Responsible for the REST API's authentication strategies
 *
 * @note authorization has not yet been implemented - all users have full access
 */
@Module({
  imports: [
    ConfigModule,
    DatastoreModule.register(),
    UsersModule,
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
  controllers: [AuthController],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
