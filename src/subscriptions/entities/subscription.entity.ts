import { EventType } from '~/events/types';
import { SubscriptionStatus } from '~/subscriptions/types';

export class SubscriptionEntity {
  public id: number;

  public eventType: EventType;

  public eventScope: string;

  public webhookUrl: string;

  public createdAt: Date;

  public ttl: number;

  public status: SubscriptionStatus;

  public triesLeft: number;

  public isExpired(): boolean {
    const { createdAt, ttl } = this;

    return new Date(createdAt.getTime() + ttl) <= new Date();
  }

  constructor(entity: Omit<SubscriptionEntity, 'isExpired'>) {
    Object.assign(this, entity);
  }
}
