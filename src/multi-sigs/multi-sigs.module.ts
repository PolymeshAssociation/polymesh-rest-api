import { Module } from '@nestjs/common';

import { AccountsModule } from '~/accounts/accounts.module';
import { MultiSigsController } from '~/multi-sigs/multi-sigs.controller';
import { MultiSigsService } from '~/multi-sigs/multi-sigs.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [AccountsModule, PolymeshModule, TransactionsModule],
  providers: [MultiSigsService],
  controllers: [MultiSigsController],
})
export class MultiSigsModule {}
