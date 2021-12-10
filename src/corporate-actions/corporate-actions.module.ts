/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { CorporateActionsController } from '~/corporate-actions/corporate-actions.controller';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';

@Module({
  imports: [AssetsModule, RelayerAccountsModule],
  controllers: [CorporateActionsController],
  providers: [CorporateActionsService],
})
export class CorporateActionsModule {}
