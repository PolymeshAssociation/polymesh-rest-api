/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';

import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  imports: [PolymeshModule, RelayerAccountsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
