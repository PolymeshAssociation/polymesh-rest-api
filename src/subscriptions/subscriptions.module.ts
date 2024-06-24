import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatastoreModule } from '~/datastore/datastore.module';
import { LoggerModule } from '~/logger/logger.module';
import { ScheduleModule } from '~/schedule/schedule.module';
import subscriptionsConfig from '~/subscriptions/config/subscriptions.config';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';

@Module({
  imports: [
    DatastoreModule.registerAsync(),
    ConfigModule.forFeature(subscriptionsConfig),
    ScheduleModule,
    HttpModule,
    LoggerModule,
  ],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
