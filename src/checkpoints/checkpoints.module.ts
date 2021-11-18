/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { CheckpointsController } from '~/checkpoints/checkpoints.controller';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';

@Module({
  imports: [AssetsModule, RelayerAccountsModule],
  providers: [CheckpointsService],
  exports: [CheckpointsService],
  controllers: [CheckpointsController],
})
export class CheckpointsModule {}
