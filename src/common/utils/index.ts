import { ModuleName, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { flatten } from 'lodash';

import { NotificationPayloadModel } from '~/common/models/notification-payload-model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { EventType } from '~/events/types';
import { NotificationPayload } from '~/notifications/types';
import { TransactionResult } from '~/transactions/transactions.util';

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
  NotificationPayload<EventType.TransactionUpdate> | TransactionResult<T>
>;

// A helper type that lets a controller return a Model or a Subscription Receipt
export type TransactionResolver<T> = (
  res: TransactionResult<T>
) => Promise<TransactionQueueModel> | TransactionQueueModel;

export const handlePayload = <T>(
  result: NotificationPayloadModel | TransactionResult<T>,
  resolver: TransactionResolver<T> = basicModelResolver
): NotificationPayloadModel | Promise<TransactionQueueModel> | TransactionQueueModel => {
  if ('transactions' in result) {
    return resolver(result);
  } else {
    return new NotificationPayloadModel(result);
  }
};

/**
 * A helper function for controllers when they should return a basic TransactionQueueModel
 */
const basicModelResolver: TransactionResolver<unknown> = ({ transactions }) => {
  return new TransactionQueueModel({ transactions });
};
