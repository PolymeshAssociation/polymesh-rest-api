/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { ConfidentialAccountsModule } from '~/confidential-accounts/confidential-accounts.module';
import { ConfidentialProofsModule } from '~/confidential-proofs/confidential-proofs.module';
import { ConfidentialTransactionsController } from '~/confidential-transactions/confidential-transactions.controller';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { ConfidentialVenuesController } from '~/confidential-transactions/confidential-venues.controller';
import { IdentitiesModule } from '~/identities/identities.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [
    PolymeshModule,
    TransactionsModule,
    ConfidentialAccountsModule,
    ConfidentialProofsModule.register(),
    forwardRef(() => IdentitiesModule),
  ],
  providers: [ConfidentialTransactionsService],
  controllers: [ConfidentialTransactionsController, ConfidentialVenuesController],
  exports: [ConfidentialTransactionsService],
})
export class ConfidentialTransactionsModule {}
