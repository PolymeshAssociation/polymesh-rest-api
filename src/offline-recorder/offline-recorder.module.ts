/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { DatastoreModule } from '~/datastore/datastore.module';
import { LoggerModule } from '~/logger/logger.module';
import { OfflineRecorderService } from '~/offline-recorder/offline-recorder.service';

@Module({
  imports: [ArtemisModule, DatastoreModule.registerAsync(), LoggerModule],
  providers: [OfflineRecorderService],
})
export class OfflineRecorderModule {}
