/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';

import { CheckpointsController } from './checkpoints.controller';

@Module({
  imports: [AssetsModule],
  providers: [CheckpointsService],
  exports: [CheckpointsService],
  controllers: [CheckpointsController],
})
export class CheckpointsModule {}
