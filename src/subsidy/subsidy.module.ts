import { forwardRef, Module } from '@nestjs/common';

import { AccountsModule } from '~/accounts/accounts.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SubsidyController } from '~/subsidy/subsidy.controller';
import { SubsidyService } from '~/subsidy/subsidy.service';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule, forwardRef(() => AccountsModule)],
  controllers: [SubsidyController],
  providers: [SubsidyService],
  exports: [SubsidyService],
})
export class SubsidyModule {}
