/* istanbul ignore file */
import { forwardRef, Module } from '@nestjs/common';

import { ConfidentialAccountsModule } from '~/confidential-accounts/confidential-accounts.module';
import { ConfidentialAssetsController } from '~/confidential-assets/confidential-assets.controller';
import { ConfidentialAssetsService } from '~/confidential-assets/confidential-assets.service';
import { ConfidentialProofsModule } from '~/confidential-proofs/confidential-proofs.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [
    PolymeshModule,
    TransactionsModule,
    ConfidentialAccountsModule,
    forwardRef(() => ConfidentialProofsModule.register()),
  ],
  controllers: [ConfidentialAssetsController],
  providers: [ConfidentialAssetsService],
  exports: [ConfidentialAssetsService],
})
export class ConfidentialAssetsModule {}
