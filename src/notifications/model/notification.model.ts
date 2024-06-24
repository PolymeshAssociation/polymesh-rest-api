/* istanbul ignore file */

import { NotificationStatus } from '~/notifications/types';

export class NotificationModel {
  public id: number;

  public subscriptionId: number;

  public eventId: number;

  public triesLeft: number;

  public status: NotificationStatus;

  public createdAt: Date;

  public nonce: number;

  constructor(entity: NotificationModel) {
    Object.assign(this, entity);
  }
}
