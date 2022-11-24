/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { NetworkModule } from '~/network/network.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule, NetworkModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
