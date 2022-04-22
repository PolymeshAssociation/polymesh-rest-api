import { forwardRef, Module } from '@nestjs/common';

import { EventsService } from '~/events/events.service';
import { NotificationsModule } from '~/notifications/notifications.module';
import { SubscriptionsModule } from '~/subscriptions/subscriptions.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), SubscriptionsModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
