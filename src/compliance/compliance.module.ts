/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { ComplianceController } from '~/compliance/compliance.controller';
import { ComplianceService } from '~/compliance/compliance.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { SigningModule } from '~/signing/signing.module';

@Module({
  imports: [forwardRef(() => AssetsModule), IdentitiesModule, SigningModule],
  providers: [ComplianceService],
  exports: [ComplianceService],
  controllers: [ComplianceController],
})
export class ComplianceModule {}
