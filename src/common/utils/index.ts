import { ModuleName, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { flatten } from 'lodash';

import { NotificationPayloadModel } from '~/common/models/notification-payload-model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { EventType } from '~/events/types';
import { NotificationPayload } from '~/notifications/types';
import { QueueResult } from '~/transactions/transactions.util';

/* istanbul ignore next */
export function getTxTags(): string[] {
  return flatten(Object.values(TxTags).map(txTag => Object.values(txTag)));
}

/* istanbul ignore next */
export function getTxTagsWithModuleNames(): string[] {
  const txTags = getTxTags();
  const moduleNames = Object.values(ModuleName);
  return [...moduleNames, ...txTags];
}

export type ApiTransactionResponse = NotificationPayloadModel | TransactionQueueModel;

// A helper type that lets a service return a QueueResult or a Subscription Receipt
export type ServiceReturn<T> = Promise<
  NotificationPayload<EventType.TransactionUpdate> | QueueResult<T>
>;

// A helper type that lets a controller return a Model or a Subscription Receipt
export type ModelResolver<T> = (res: QueueResult<T>) => Promise<TransactionQueueModel>;

export const handlePayload = <T>(
  result: NotificationPayloadModel | QueueResult<T>,
  resolver: ModelResolver<T>
): NotificationPayloadModel | Promise<TransactionQueueModel> => {
  if ('transactions' in result) {
    return resolver(result);
  } else {
    return new NotificationPayloadModel(result);
  }
};
