import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { OfflineSubmitterService } from '~/offline-submitter/offline-submitter.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';

@Module({
  imports: [ArtemisModule, PolymeshModule],
  providers: [OfflineSubmitterService],
})
export class OfflineSubmitterModule {}
