import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EventsModule } from '~/events/events.module';
import { LoggerModule } from '~/logger/logger.module';
import { SigningModule } from '~/signing/signing.module';
import { SubscriptionsModule } from '~/subscriptions/subscriptions.module';
import transactionsConfig from '~/transactions/config/transactions.config';
import { TransactionsService } from '~/transactions/transactions.service';

@Module({
  imports: [
    ConfigModule.forFeature(transactionsConfig),
    EventsModule,
    SigningModule,
    SubscriptionsModule,
    LoggerModule,
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
