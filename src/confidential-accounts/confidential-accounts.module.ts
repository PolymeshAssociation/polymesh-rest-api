/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ConfidentialAccountsController } from '~/confidential-accounts/confidential-accounts.controller';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule],
  controllers: [ConfidentialAccountsController],
  providers: [ConfidentialAccountsService],
  exports: [ConfidentialAccountsService],
})
export class ConfidentialAccountsModule {}
