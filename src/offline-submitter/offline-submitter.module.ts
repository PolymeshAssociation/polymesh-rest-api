import { Module } from '@nestjs/common';

import { ArtemisModule } from '~/artemis/artemis.module';
import { DatastoreModule } from '~/datastore/datastore.module';
import { LoggerModule } from '~/logger/logger.module';
import { OfflineSubmitterService } from '~/offline-submitter/offline-submitter.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';

@Module({
  imports: [ArtemisModule, DatastoreModule.registerAsync(), PolymeshModule, LoggerModule],
  providers: [OfflineSubmitterService],
})
export class OfflineSubmitterModule {}
