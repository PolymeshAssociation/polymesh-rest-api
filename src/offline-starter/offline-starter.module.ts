import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { OfflineStarterService } from '~/offline-starter/offline-starter.service';

@Module({
  imports: [ArtemisModule],
  providers: [OfflineStarterService],
  exports: [OfflineStarterService],
})
export class OfflineStarterModule {}
