/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { LoggerModule } from '~/logger/logger.module';
import { ArtemisService } from '~/message/artemis/artemis.service';
import { MessageService } from '~/message/common/message.service';

@Module({
  imports: [LoggerModule],
  providers: [{ provide: MessageService, useClass: ArtemisService }],
  exports: [MessageService],
})
export class ArtemisModule {}
