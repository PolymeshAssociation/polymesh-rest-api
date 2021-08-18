/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { ComplianceController } from '~/compliance/compliance.controller';
import { ComplianceService } from '~/compliance/compliance.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';

@Module({
  imports: [forwardRef(() => AssetsModule), RelayerAccountsModule],
  providers: [ComplianceService],
  exports: [ComplianceService],
  controllers: [ComplianceController],
})
export class ComplianceModule {}
