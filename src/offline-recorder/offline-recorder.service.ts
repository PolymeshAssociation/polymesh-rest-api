import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { TopicName } from '~/common/utils/amqp';
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
      TopicName.Requests,
      /* istanbul ignore next */
      msg => this.recordEvent(TopicName.Requests, msg),
      AnyModel
    );
    this.artemisService.registerListener(
      TopicName.Signatures,
      /* istanbul ignore next */
      msg => this.recordEvent(TopicName.Signatures, msg),
      AnyModel
    );
    this.artemisService.registerListener(
      TopicName.Finalizations,
      /* istanbul ignore next */
      msg => this.recordEvent(TopicName.Finalizations, msg),
      AnyModel
    );
  }

  public async recordEvent(topic: TopicName, msg: AnyModel): Promise<void> {
    this.logger.debug(`recording event for: ${topic}`);
    await this.offlineRepo.recordEvent(topic, msg);
  }
}
