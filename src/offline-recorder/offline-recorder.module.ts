import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { DatastoreModule } from '~/datastore/datastore.module';
import { OfflineRecorderService } from '~/offline-recorder/offline-recorder.service';

@Module({
  imports: [ArtemisModule, DatastoreModule.registerAsync()],
  providers: [OfflineRecorderService],
})
export class OfflineRecorderModule {}
