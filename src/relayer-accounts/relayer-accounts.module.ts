import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import relayerAccountsConfig from '~/relayer-accounts/config/relayer-accounts.config';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Module({
  imports: [ConfigModule.forFeature(relayerAccountsConfig)],
  providers: [RelayerAccountsService],
  exports: [RelayerAccountsService],
})
export class RelayerAccountsModule {}
