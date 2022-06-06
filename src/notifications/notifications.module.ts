import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EventsModule } from '~/events/events.module';
import { LoggerModule } from '~/logger/logger.module';
import notificationsConfig from '~/notifications/config/notifications.config';
import { NotificationsService } from '~/notifications/notifications.service';
import { ScheduleModule } from '~/schedule/schedule.module';
import { SubscriptionsModule } from '~/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forFeature(notificationsConfig),
    forwardRef(() => EventsModule),
    SubscriptionsModule,
    HttpModule,
    ScheduleModule,
    LoggerModule,
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
