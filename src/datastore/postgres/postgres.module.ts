/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { apiKeyRepoProvider } from '~/datastore/postgres/entities/api-key.entity';
import { offlineEventRepoProvider } from '~/datastore/postgres/entities/offline-event.entity';
import { userRepoProvider } from '~/datastore/postgres/entities/user.entity';
import { PostgresApiKeyRepo } from '~/datastore/postgres/repos/api-keys.repo';
import { PostgresOfflineRepo } from '~/datastore/postgres/repos/offline.repo';
import { PostgresUsersRepo } from '~/datastore/postgres/repos/users.repo';
import { OfflineRepo } from '~/offline-recorder/repo/offline.repo';
import { UsersRepo } from '~/users/repo/user.repo';

/**
 * providers Repos that use Postgres to store state
 */
@Module({
  providers: [
    apiKeyRepoProvider,
    userRepoProvider,
    offlineEventRepoProvider,
    { provide: UsersRepo, useClass: PostgresUsersRepo },
    { provide: ApiKeyRepo, useClass: PostgresApiKeyRepo },
    { provide: OfflineRepo, useClass: PostgresOfflineRepo },
  ],
  exports: [ApiKeyRepo, UsersRepo, OfflineRepo],
})
export class PostgresModule {}
