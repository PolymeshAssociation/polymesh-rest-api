/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { CheckpointsController } from '~/checkpoints/checkpoints.controller';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { LoggerModule } from '~/logger/logger.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [AssetsModule, TransactionsModule, LoggerModule],
  providers: [CheckpointsService],
  exports: [CheckpointsService],
  controllers: [CheckpointsController],
})
export class CheckpointsModule {}
