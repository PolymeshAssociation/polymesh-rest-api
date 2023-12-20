/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { LoggerModule } from '~/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [ArtemisService],
  exports: [ArtemisService],
})
export class ArtemisModule {}
