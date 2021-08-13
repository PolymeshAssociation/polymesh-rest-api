/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { OfferingsService } from '~/offerings/offerings.service';

import { OfferingsController } from './offerings.controller';

@Module({
  imports: [forwardRef(() => AssetsModule)],
  providers: [OfferingsService, PolymeshLogger],
  exports: [OfferingsService],
  controllers: [OfferingsController],
})
export class OfferingsModule {}
