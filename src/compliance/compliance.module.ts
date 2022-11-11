/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { ComplianceRequirementsController } from '~/compliance/compliance-requirements.controller';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { TrustedClaimIssuersController } from '~/compliance/trusted-claim-issuers.controller';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [forwardRef(() => AssetsModule), IdentitiesModule, TransactionsModule],
  providers: [ComplianceRequirementsService, TrustedClaimIssuersService],
  exports: [ComplianceRequirementsService, TrustedClaimIssuersService],
  controllers: [ComplianceRequirementsController, TrustedClaimIssuersController],
})
export class ComplianceModule {}
