import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { OfflineSignerService } from '~/offline-signer/offline-signer.service';
import { SigningModule } from '~/signing/signing.module';

@Module({
  imports: [ArtemisModule, SigningModule],
  providers: [OfflineSignerService],
})
export class OfflineSignerModule {}
