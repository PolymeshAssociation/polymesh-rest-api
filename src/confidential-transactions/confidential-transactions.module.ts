import { Module } from '@nestjs/common';

import { ConfidentialTransactionsController } from '~/confidential-transactions/confidential-transactions.controller';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { ConfidentialVenuesController } from '~/confidential-transactions/confidential-venues.controller';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule],
  providers: [ConfidentialTransactionsService],
  controllers: [ConfidentialTransactionsController, ConfidentialVenuesController],
  exports: [ConfidentialTransactionsService],
})
export class ConfidentialTransactionsModule {}
