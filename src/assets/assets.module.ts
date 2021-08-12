/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AssetsController } from '~/assets/assets.controller';
import { AssetsService } from '~/assets/assets.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';

@Module({
  imports: [PolymeshModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
