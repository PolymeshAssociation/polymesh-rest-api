/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { LocalApiKeysRepo } from '~/datastore/local-store/repos/api-key.repo';
import { LocalOfflineRepo } from '~/datastore/local-store/repos/offline-event.repo';
import { LocalUserRepo } from '~/datastore/local-store/repos/users.repo';
import { OfflineRepo } from '~/offline-recorder/repo/offline.repo';
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
      provide: OfflineRepo,
      useClass: LocalOfflineRepo,
    },
  ],
  exports: [ApiKeyRepo, UsersRepo, OfflineRepo],
})
export class LocalStoreModule {}
