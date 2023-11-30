import { Module } from '@nestjs/common';

import { NftsController } from '~/nfts/nfts.controller';
import { NftsService } from '~/nfts/nfts.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule],
  controllers: [NftsController],
  providers: [NftsService],
})
export class NftsModule {}
