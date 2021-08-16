/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { OfferingsService } from '~/offerings/offerings.service';

import { OfferingsController } from './offerings.controller';

@Module({
  imports: [forwardRef(() => AssetsModule)],
  providers: [OfferingsService],
  exports: [OfferingsService],
  controllers: [OfferingsController],
})
export class OfferingsModule {}
