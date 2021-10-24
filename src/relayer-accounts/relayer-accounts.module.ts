import { Module } from '@nestjs/common';

import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Module({
  providers: [RelayerAccountsService],
  exports: [RelayerAccountsService],
})
export class RelayerAccountsModule {}
