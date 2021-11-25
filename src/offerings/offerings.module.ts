/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { OfferingsController } from '~/offerings/offerings.controller';
import { OfferingsService } from '~/offerings/offerings.service';

@Module({
  imports: [forwardRef(() => AssetsModule)],
  providers: [OfferingsService],
  exports: [OfferingsService],
  controllers: [OfferingsController],
})
export class OfferingsModule {}
