import { EventType, GetPayload } from '~/events/types';
import { NotificationModel } from '~/notifications/model/notification.model';

export enum NotificationStatus {
  /**
   * waiting to be received and acknowledged by consumer
   */
  Active = 'active',
  /**
   * properly received by consumer
   */
  Acknowledged = 'acknowledged',
  /**
   * couldn't be delivered after max retries
   */
  Failed = 'failed',
  /**
   * subscription expired before the notification was acknowledged
   */
  Orphaned = 'orphaned',
}

export type NotificationPayload<T extends EventType = EventType> = {
  subscriptionId: number;
  type: T;
  scope: string;
  nonce: number;
  payload: GetPayload<T>;
};

export type NotificationParams = Pick<
  NotificationModel,
  'eventId' | 'subscriptionId' | 'nonce' | 'status' | 'triesLeft'
>;
