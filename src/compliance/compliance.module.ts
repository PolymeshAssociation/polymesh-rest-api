/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { ComplianceController } from '~/compliance/compliance.controller';
import { ComplianceService } from '~/compliance/compliance.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [forwardRef(() => AssetsModule), IdentitiesModule, TransactionsModule],
  providers: [ComplianceService],
  exports: [ComplianceService],
  controllers: [ComplianceController],
})
export class ComplianceModule {}
