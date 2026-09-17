/* istanbul ignore file */

import { DynamicModule, Logger, Module } from '@nestjs/common';

import { isSignerManagementEnabled } from '~/common/utils/feature-flags';
import { SignerManagementController } from '~/signing/signer-management.controller';
import { SigningModule } from '~/signing/signing.module';

/**
 * Exposes the endpoints that add keys to the signing manager when `SIGNER_MANAGEMENT_ENABLED` resolves to true
 */
@Module({})
export class SignerManagementModule {
  static register(): DynamicModule {
    const enabled = isSignerManagementEnabled();

    if (enabled) {
      new Logger(SignerManagementModule.name).warn(
        'Signer management endpoints are enabled. Make sure they are not reachable by untrusted callers'
      );
    }

    return {
      module: SignerManagementModule,
      imports: [SigningModule],
      controllers: enabled ? [SignerManagementController] : [],
    };
  }
}
