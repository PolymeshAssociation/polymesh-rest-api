/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { apiKeyRepoProvider } from '~/datastore/postgres/entities/api-key.entity';
import { userRepoProvider } from '~/datastore/postgres/entities/user.entity';
import { PostgresApiKeyRepo } from '~/datastore/postgres/repos/api-keys.repo';
import { PostgresUsersRepo } from '~/datastore/postgres/repos/users.repo';
import { UsersRepo } from '~/users/repo/user.repo';

/**
 * providers Repos that use Postgres to store state
 */
@Module({
  providers: [
    apiKeyRepoProvider,
    userRepoProvider,
    { provide: UsersRepo, useClass: PostgresUsersRepo },
    { provide: ApiKeyRepo, useClass: PostgresApiKeyRepo },
  ],
  exports: [ApiKeyRepo, UsersRepo],
})
export class PostgresModule {}
