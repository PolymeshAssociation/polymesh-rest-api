/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { apiKeyRepoProvider } from '~/datastore/postgres/entities/api-key.entity';
import { notificationRepoProvider } from '~/datastore/postgres/entities/notification.entity';
import { offlineEventRepoProvider } from '~/datastore/postgres/entities/offline-event.entity';
import { offlineTxRepoProvider } from '~/datastore/postgres/entities/offline-tx.entity';
import { subscriptionRepoProvider } from '~/datastore/postgres/entities/subscription.entity';
import { userRepoProvider } from '~/datastore/postgres/entities/user.entity';
import { PostgresApiKeyRepo } from '~/datastore/postgres/repos/api-keys.repo';
import { PostgresNotificationRepo } from '~/datastore/postgres/repos/notification.repo';
import { PostgresOfflineEventRepo } from '~/datastore/postgres/repos/offline-event.repo';
import { PostgresOfflineTxRepo } from '~/datastore/postgres/repos/offline-tx.repo';
import { PostgresSubscriptionRepo } from '~/datastore/postgres/repos/subscription.repo';
import { PostgresUsersRepo } from '~/datastore/postgres/repos/users.repo';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
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
    notificationRepoProvider,
    subscriptionRepoProvider,
    { provide: UsersRepo, useClass: PostgresUsersRepo },
    { provide: ApiKeyRepo, useClass: PostgresApiKeyRepo },
    { provide: OfflineEventRepo, useClass: PostgresOfflineEventRepo },
    { provide: OfflineTxRepo, useClass: PostgresOfflineTxRepo },
    { provide: NotificationRepo, useClass: PostgresNotificationRepo },
    { provide: SubscriptionRepo, useClass: PostgresSubscriptionRepo },
  ],
  exports: [
    ApiKeyRepo,
    UsersRepo,
    OfflineEventRepo,
    OfflineTxRepo,
    NotificationRepo,
    SubscriptionRepo,
  ],
})
export class PostgresModule {}
