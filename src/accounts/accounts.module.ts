/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { NetworkService } from '~/network/network.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule],
  controllers: [AccountsController],
  providers: [AccountsService, NetworkService],
  exports: [AccountsService],
})
export class AccountsModule {}
