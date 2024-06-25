/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { LocalApiKeysRepo } from '~/datastore/local-store/repos/api-key.repo';
import { LocalNotificationRepo } from '~/datastore/local-store/repos/notification.repo';
import { LocalOfflineEventRepo } from '~/datastore/local-store/repos/offline-event.repo';
import { LocalOfflineTxRepo } from '~/datastore/local-store/repos/offline-tx.repo';
import { LocalSubscriptionRepo } from '~/datastore/local-store/repos/subscription.repo';
import { LocalUserRepo } from '~/datastore/local-store/repos/users.repo';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
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
    { provide: SubscriptionRepo, useClass: LocalSubscriptionRepo },
    { provide: NotificationRepo, useClass: LocalNotificationRepo },
  ],
  exports: [
    ApiKeyRepo,
    UsersRepo,
    OfflineEventRepo,
    OfflineTxRepo,
    SubscriptionRepo,
    NotificationRepo,
  ],
})
export class LocalStoreModule {}
