import { Module } from '@nestjs/common';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';

@Module({
  imports: [PolymeshModule, RelayerAccountsModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
