import { Module } from '@nestjs/common';

import { EventsModule } from '~/events/events.module';
import { LoggerModule } from '~/logger/logger.module';
import { SubscriptionsModule } from '~/subscriptions/subscriptions.module';
import { TransactionsService } from '~/transactions/transactions.service';

@Module({
  imports: [EventsModule, SubscriptionsModule, LoggerModule],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
