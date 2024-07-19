import { Module } from '@nestjs/common';

import { DatastoreModule } from '~/datastore/datastore.module';
import { LoggerModule } from '~/logger/logger.module';
import { MessageModule } from '~/message/message.module';
import { OfflineSubmitterService } from '~/offline-submitter/offline-submitter.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';

@Module({
  imports: [
    MessageModule.registerAsync(),
    DatastoreModule.registerAsync(),
    PolymeshModule,
    LoggerModule,
  ],
  providers: [OfflineSubmitterService],
})
export class OfflineSubmitterModule {}
