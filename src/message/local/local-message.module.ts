/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { LoggerModule } from '~/logger/logger.module';
import { MessageService } from '~/message/common/message.service';
import { LocalMessageService } from '~/message/local/local-message.service';

/**
 * provides a local message service
 */
@Module({
  imports: [LoggerModule],
  providers: [{ provide: MessageService, useClass: LocalMessageService }],
  exports: [MessageService],
})
export class LocalMessageModule {}
