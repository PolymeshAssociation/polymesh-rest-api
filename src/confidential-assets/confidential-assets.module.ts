import { Module } from '@nestjs/common';

import { ConfidentialAssetsController } from '~/confidential-assets/confidential-assets.controller';
import { ConfidentialAssetsService } from '~/confidential-assets/confidential-assets.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule],
  controllers: [ConfidentialAssetsController],
  providers: [ConfidentialAssetsService],
  exports: [ConfidentialAssetsService],
})
export class ConfidentialAssetsModule {}
