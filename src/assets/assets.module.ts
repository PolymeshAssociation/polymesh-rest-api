/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsController } from '~/assets/assets.controller';
import { AssetsService } from '~/assets/assets.service';
import { ComplianceModule } from '~/compliance/compliance.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SignerModule } from '~/signer/signer.module';

@Module({
  imports: [
    forwardRef(() => PolymeshModule),
    forwardRef(() => ComplianceModule),
    forwardRef(() => SignerModule),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
