/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { DatastoreModule } from '~/datastore/datastore.module';
import { LoggerModule } from '~/logger/logger.module';
import { MessageModule } from '~/message/message.module';
import { OfflineRecorderService } from '~/offline-recorder/offline-recorder.service';

@Module({
  imports: [LoggerModule, MessageModule.registerAsync(), DatastoreModule.registerAsync()],
  providers: [OfflineRecorderService],
})
export class OfflineRecorderModule {}
