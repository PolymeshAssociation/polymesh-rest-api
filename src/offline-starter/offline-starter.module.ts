import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { LoggerModule } from '~/logger/logger.module';
import { OfflineStarterService } from '~/offline-starter/offline-starter.service';

@Module({
  imports: [ArtemisModule, LoggerModule],
  providers: [OfflineStarterService],
  exports: [OfflineStarterService],
})
export class OfflineStarterModule {}
