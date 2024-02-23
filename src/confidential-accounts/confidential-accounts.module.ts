/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ConfidentialAccountsController } from '~/confidential-accounts/confidential-accounts.controller';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { ProofServerModule } from '~/proof-server/proof-server.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule, ProofServerModule],
  controllers: [ConfidentialAccountsController],
  providers: [ConfidentialAccountsService],
  exports: [ConfidentialAccountsService],
})
export class ConfidentialAccountsModule {}
