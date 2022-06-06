/* istanbul ignore file */

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

  public nextNonce: number;

  /**
   * secret for the legitimacy signature. This shared secret is used to
   *   compute an HMAC of every notification payload being sent to `webhookUrl` and sent
   *   as part of the request headers. It can be used by the consumer of the subscription
   *   to verify that messages received by their webhooks are being sent by us
   */
  public legitimacySecret: string;

  public isExpired(): boolean {
    const { createdAt, ttl } = this;

    return new Date(createdAt.getTime() + ttl) <= new Date();
  }

  constructor(entity: Omit<SubscriptionEntity, 'isExpired'>) {
    Object.assign(this, entity);
  }
}
