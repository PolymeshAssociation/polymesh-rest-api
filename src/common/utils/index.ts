import { ModuleName, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { randomBytes } from 'crypto';
import { flatten } from 'lodash';
import { promisify } from 'util';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
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

export type TransactionResponseModel = NotificationPayloadModel | TransactionQueueModel;

/**
 * A helper type that lets a service return a QueueResult or a Subscription Receipt
 */
export type ServiceReturn<T> = Promise<
  NotificationPayload<EventType.TransactionUpdate> | TransactionResult<T>
>;

/**
 * A helper type that lets a controller return a Model or a Subscription Receipt if webhookUrl is being used
 */
export type TransactionResolver<T> = (
  res: TransactionResult<T>
) => Promise<TransactionQueueModel> | TransactionQueueModel;

/**
 * A helper function that transforms a service result for a controller. A controller can pass a resolver for a detailed return model, otherwise the transaction details will be used as a default
 */
export const handleServiceResult = <T>(
  result: NotificationPayloadModel | TransactionResult<T>,
  resolver: TransactionResolver<T> = basicModelResolver
): NotificationPayloadModel | Promise<TransactionQueueModel> | TransactionQueueModel => {
  if ('transactions' in result) {
    return resolver(result);
  }

  return new NotificationPayloadModel(result);
};

/**
 * A helper function for controllers when they should return a basic TransactionQueueModel
 */
const basicModelResolver: TransactionResolver<unknown> = ({ transactions, details }) => {
  return new TransactionQueueModel({ transactions, details });
};

/**
 * Generate base64 encoded, cryptographically random bytes
 *
 * @note random byte length given, not the encoded string length
 */
export const generateBase64Secret = async (byteLength: number): Promise<string> => {
  const buf = await promisify(randomBytes)(byteLength);

  return buf.toString('base64');
};

/**
 * Helper class to ensure a code path is unreachable. For example this can be used for ensuring switch statements are exhaustive
 */
export class UnreachableCaseError extends Error {
  /** This should never be called */
  constructor(val: never) {
    super(`Unreachable case: ${JSON.stringify(val)}`);
  }
}

export const extractTxBase = <T extends TransactionBaseDto>(
  params: T
): {
  base: TransactionBaseDto;
  args: Omit<T, keyof TransactionBaseDto>;
} => {
  const { signer, webhookUrl, dryRun, ...args } = params;
  return {
    base: { signer, webhookUrl, dryRun },
    args,
  };
};
