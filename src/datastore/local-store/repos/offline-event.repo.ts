import { Injectable } from '@nestjs/common';

import { TopicName } from '~/common/utils/amqp';
import { OfflineEventModel } from '~/offline-recorder/model/event.model';
import { OfflineRepo } from '~/offline-recorder/repo/offline.repo';

@Injectable()
export class LocalOfflineRepo implements OfflineRepo {
  private events: Record<string, unknown> = {};
  private _id: number = 1;

  public async recordEvent(
    name: TopicName,
    body: Record<string, unknown>
  ): Promise<OfflineEventModel> {
    const id = this.nextId();
    const model = { id, name, body };
    this.events[id] = model;

    return model;
  }

  private nextId(): string {
    return (this._id++).toString();
  }
}
