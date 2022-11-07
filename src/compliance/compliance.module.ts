/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { ComplianceRequirementsController } from '~/compliance/compliance-requirements.controller';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [forwardRef(() => AssetsModule), IdentitiesModule, TransactionsModule],
  providers: [ComplianceRequirementsService],
  exports: [ComplianceRequirementsService],
  controllers: [ComplianceRequirementsController],
})
export class ComplianceModule {}
