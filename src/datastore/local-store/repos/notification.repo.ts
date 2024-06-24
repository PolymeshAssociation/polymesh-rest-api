import { Injectable } from '@nestjs/common';

import { NotificationModel } from '~/notifications/model/notification.model';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';
import { NotificationParams, NotificationStatus } from '~/notifications/types';

const triesLeft = 10;

@Injectable()
export class LocalNotificationRepo extends NotificationRepo {
  private currentId = 0;
  private notifications: Record<string, NotificationModel> = {};

  public async create(params: NotificationParams): Promise<NotificationModel> {
    this.currentId += 1;

    const model = new NotificationModel({
      id: this.currentId,
      ...params,
      triesLeft,
      status: NotificationStatus.Active,
      createdAt: new Date(),
    });

    this.notifications[model.id] = model;

    return model;
  }

  public async update(id: number, params: NotificationParams): Promise<NotificationModel> {
    const model = this.notifications[id];

    const updated = {
      ...model,
      ...params,
    };

    this.notifications[id] = updated;

    return updated;
  }

  public async findById(id: number): Promise<NotificationModel> {
    return this.notifications[id];
  }
}
