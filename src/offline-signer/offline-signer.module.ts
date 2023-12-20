import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { LoggerModule } from '~/logger/logger.module';
import { OfflineSignerService } from '~/offline-signer/offline-signer.service';
import { SigningModule } from '~/signing/signing.module';

@Module({
  imports: [ArtemisModule, SigningModule, LoggerModule],
  providers: [OfflineSignerService],
})
export class OfflineSignerModule {}
