/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsController } from '~/assets/assets.controller';
import { AssetsService } from '~/assets/assets.service';
import { OfferingsModule } from '~/offerings/offerings.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';

@Module({
  imports: [PolymeshModule, forwardRef(() => OfferingsModule)],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
