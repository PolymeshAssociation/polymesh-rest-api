/* istanbul ignore file */

import { EventPayload, EventType } from '~/events/types';

export class EventEntity<T extends EventPayload = EventPayload> {
  public id: number;

  public type: EventType;

  /**
   * scope of the event, helps narrow down subscriptions. For example, in a `transaction.update` event,
   *   the scope would be the identifier of the transaction that was updated.
   */
  public scope: string;

  public createdAt: Date;

  /**
   * event data that will be sent to subscribers (freeform, depends on the event)
   */
  public payload: T;

  /**
   * whether all required notifications for this event have been created (for recovery purposes)
   */
  public processed: boolean;

  constructor(entity: EventEntity<T>) {
    Object.assign(this, entity);
  }
}
