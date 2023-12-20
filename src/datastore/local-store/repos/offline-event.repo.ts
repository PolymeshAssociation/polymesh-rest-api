import { Injectable } from '@nestjs/common';

import { TopicName } from '~/common/utils/amqp';
import { OfflineEventModel } from '~/offline-recorder/model/offline-event.model';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';

@Injectable()
export class LocalOfflineEventRepo implements OfflineEventRepo {
  private events: Record<string, unknown> = {};
  private _id: number = 1;

  public async recordEvent(
    topicName: TopicName,
    body: Record<string, unknown>
  ): Promise<OfflineEventModel> {
    const id = this.nextId();
    const model = { id, topicName, body };
    this.events[id] = model;

    return model;
  }

  private nextId(): string {
    return (this._id++).toString();
  }
}
