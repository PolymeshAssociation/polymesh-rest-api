import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppNotFoundError } from '~/common/errors';
import { Notification } from '~/datastore/postgres/entities/notification.entity';
import { convertTypeOrmErrorToAppError } from '~/datastore/postgres/repos/utils';
import { NotificationModel } from '~/notifications/model/notification.model';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';
import { NotificationParams } from '~/notifications/types';

@Injectable()
export class PostgresNotificationRepo implements NotificationRepo {
  constructor(@InjectRepository(Notification) private notificationRepo: Repository<Notification>) {}

  public async create(params: NotificationParams): Promise<NotificationModel> {
    const entity = this.notificationRepo.create({
      ...params,
    });

    await this.notificationRepo
      .save(entity)
      .catch(
        convertTypeOrmErrorToAppError(
          `Subscription ID: ${params.subscriptionId}`,
          NotificationRepo.type
        )
      );

    const notification = new NotificationModel({
      ...entity,
    });
    return notification;
  }

  public async findById(id: number): Promise<NotificationModel> {
    const entity = await this.notificationRepo.findOneBy({ id });

    if (!entity) {
      throw new AppNotFoundError(id.toString(), 'notification');
    }

    return new NotificationModel({
      ...entity,
    });
  }

  public async update(id: number, params: NotificationParams): Promise<NotificationModel> {
    await this.notificationRepo.update(id, params);

    const notification = await this.findById(id);

    return notification;
  }
}
