import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { QueueName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { AnyModel } from '~/offline-recorder/model/any.model';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';

/**
 * A passive recorder meant to record a full transcription of published events
 */
@Injectable()
export class OfflineRecorderService {
  constructor(
    private readonly artemisService: ArtemisService,
    private readonly offlineRepo: OfflineEventRepo,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(OfflineRecorderService.name);

    this.artemisService.registerListener(
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
