import { Module } from '@nestjs/common';

import { LoggerModule } from '~/logger/logger.module';
import { MessageModule } from '~/message/message.module';
import { OfflineStarterService } from '~/offline-starter/offline-starter.service';

@Module({
  imports: [MessageModule.registerAsync(), LoggerModule],
  providers: [OfflineStarterService],
  exports: [OfflineStarterService],
})
export class OfflineStarterModule {}
