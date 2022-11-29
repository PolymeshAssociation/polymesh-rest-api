/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { NetworkModule } from '~/network/network.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SubsidyModule } from '~/subsidy/subsidy.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule, NetworkModule, forwardRef(() => SubsidyModule)],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
