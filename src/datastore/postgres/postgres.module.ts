/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { apiKeyRepoProvider } from '~/datastore/postgres/entities/api-key.entity';
import { offlineEventRepoProvider } from '~/datastore/postgres/entities/offline-event.entity';
import { offlineTxRepoProvider } from '~/datastore/postgres/entities/offline-tx.entity';
import { userRepoProvider } from '~/datastore/postgres/entities/user.entity';
import { PostgresApiKeyRepo } from '~/datastore/postgres/repos/api-keys.repo';
import { PostgresOfflineEventRepo } from '~/datastore/postgres/repos/offline-event.repo';
import { PostgresOfflineTxRepo } from '~/datastore/postgres/repos/offline-tx.repo';
import { PostgresUsersRepo } from '~/datastore/postgres/repos/users.repo';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { UsersRepo } from '~/users/repo/user.repo';

/**
 * providers Repos that use Postgres to store state
 */
@Module({
  providers: [
    apiKeyRepoProvider,
    userRepoProvider,
    offlineEventRepoProvider,
    offlineTxRepoProvider,
    { provide: UsersRepo, useClass: PostgresUsersRepo },
    { provide: ApiKeyRepo, useClass: PostgresApiKeyRepo },
    { provide: OfflineEventRepo, useClass: PostgresOfflineEventRepo },
    { provide: OfflineTxRepo, useClass: PostgresOfflineTxRepo },
  ],
  exports: [ApiKeyRepo, UsersRepo, OfflineEventRepo, OfflineTxRepo],
})
export class PostgresModule {}
