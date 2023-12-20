/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { LocalApiKeysRepo } from '~/datastore/local-store/repos/api-key.repo';
import { LocalOfflineEventRepo } from '~/datastore/local-store/repos/offline-event.repo';
import { LocalOfflineTxRepo } from '~/datastore/local-store/repos/offline-tx.repo';
import { LocalUserRepo } from '~/datastore/local-store/repos/users.repo';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { UsersRepo } from '~/users/repo/user.repo';

/**
 * provides Repos that use process memory to store state
 */
@Module({
  imports: [ConfigModule],
  providers: [
    { provide: ApiKeyRepo, useClass: LocalApiKeysRepo },
    {
      provide: UsersRepo,
      useClass: LocalUserRepo,
    },
    {
      provide: OfflineEventRepo,
      useClass: LocalOfflineEventRepo,
    },
    { provide: OfflineTxRepo, useClass: LocalOfflineTxRepo },
  ],
  exports: [ApiKeyRepo, UsersRepo, OfflineEventRepo, OfflineTxRepo],
})
export class LocalStoreModule {}
