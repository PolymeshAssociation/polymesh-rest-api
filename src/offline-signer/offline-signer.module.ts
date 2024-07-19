import { Module } from '@nestjs/common';

import { LoggerModule } from '~/logger/logger.module';
import { MessageModule } from '~/message/message.module';
import { OfflineSignerService } from '~/offline-signer/offline-signer.service';
import { SigningModule } from '~/signing/signing.module';

@Module({
  imports: [MessageModule.registerAsync(), SigningModule, LoggerModule],
  providers: [OfflineSignerService],
})
export class OfflineSignerModule {}
