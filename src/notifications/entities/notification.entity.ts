import { NotificationStatus } from '~/notifications/types';

export class NotificationEntity {
  public id: number;

  public subscriptionId: number;

  public eventId: number;

  public triesLeft: number;

  public status: NotificationStatus;

  constructor(entity: NotificationEntity) {
    Object.assign(this, entity);
  }
}
