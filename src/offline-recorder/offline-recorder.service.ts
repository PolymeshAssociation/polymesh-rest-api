import { Injectable } from '@nestjs/common';

import { QueueName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { MessageService } from '~/message/common/message.service';
import { AnyModel } from '~/offline-recorder/model/any.model';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';

/**
 * A passive recorder meant to record a full transcription of published events
 */
@Injectable()
export class OfflineRecorderService {
  constructor(
    private readonly messageService: MessageService,
    private readonly offlineRepo: OfflineEventRepo,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(OfflineRecorderService.name);

    this.messageService.registerListener(
      QueueName.EventsLog,
      /* istanbul ignore next */
      msg => this.recordEvent(msg),
      AnyModel
    );
  }

  public async recordEvent(msg: AnyModel): Promise<void> {
    this.logger.debug('recording event');
    await this.offlineRepo.recordEvent(msg);
  }
}
