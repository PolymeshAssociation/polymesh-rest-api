/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { OfferingsService } from '~/offerings/offerings.service';

@Module({
  imports: [forwardRef(() => AssetsModule)],
  providers: [OfferingsService],
  exports: [OfferingsService],
})
export class OfferingsModule {}
