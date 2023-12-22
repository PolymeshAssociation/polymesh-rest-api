import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { TopicName } from '~/common/utils/amqp';
import { OfflineRepo } from '~/offline-recorder/repo/offline.repo';

@Injectable()
export class OfflineRecorderService {
  constructor(
    private readonly artemisService: ArtemisService,
    private readonly offlineRepo: OfflineRepo
  ) {
    this.artemisService.registerListener(TopicName.Requests, msg =>
      this.recordEvent(TopicName.Requests, msg)
    );
    this.artemisService.registerListener(TopicName.Submissions, msg =>
      this.recordEvent(TopicName.Submissions, msg)
    );
    this.artemisService.registerListener(TopicName.Signatures, msg =>
      this.recordEvent(TopicName.Signatures, msg)
    );
    this.artemisService.registerListener(TopicName.Finalizations, msg =>
      this.recordEvent(TopicName.Finalizations, msg)
    );
  }

  private async recordEvent(topicName: TopicName, msg: Record<string, unknown>): Promise<void> {
    await this.offlineRepo.recordEvent(topicName, msg);
  }
}
