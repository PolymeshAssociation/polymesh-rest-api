/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';

import { CorporateActionsController } from './corporate-actions.controller';
import { CorporateActionsService } from './corporate-actions.service';

@Module({
  imports: [AssetsModule],
  controllers: [CorporateActionsController],
  providers: [CorporateActionsService],
})
export class CorporateActionsModule {}
