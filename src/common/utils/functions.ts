/* istanbul ignore file */

import {
  FungibleLeg,
  Leg,
  ModuleName,
  NftLeg,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { randomBytes } from 'crypto';
import { flatten } from 'lodash';
import { promisify } from 'util';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionOptionsDto } from '~/common/dto/transaction-options.dto';
import { AppValidationError } from '~/common/errors';
import { NotificationPayloadModel } from '~/common/models/notification-payload-model';
import { TransactionPayloadResultModel } from '~/common/models/transaction-payload-result.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { ProcessMode } from '~/common/types';
import { EventType } from '~/events/types';
import { NotificationPayload } from '~/notifications/types';
import { OfflineReceiptModel } from '~/offline-starter/models/offline-receipt.model';
import { TransactionPayloadResult, TransactionResult } from '~/transactions/transactions.util';

export function getTxTags(): string[] {
  return flatten(Object.values(TxTags).map(txTag => Object.values(txTag)));
}

export function getTxTagsWithModuleNames(): string[] {
  const txTags = getTxTags();
  const moduleNames = Object.values(ModuleName);
  return [...moduleNames, ...txTags];
}

export type TransactionResponseModel =
  | OfflineReceiptModel
  | NotificationPayloadModel
  | TransactionQueueModel
  | TransactionPayloadResultModel;

/**
 * A helper type that lets a service return a QueueResult or a Subscription Receipt
 */
export type ServiceReturn<T> = Promise<
  | TransactionPayloadResult
  | NotificationPayload<EventType.TransactionUpdate>
  | TransactionResult<T>
  | OfflineReceiptModel
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
  result:
    | TransactionPayloadResult
    | NotificationPayloadModel
    | TransactionResult<T>
    | OfflineReceiptModel,
  resolver: TransactionResolver<T> = basicModelResolver
):
  | TransactionPayloadResultModel
  | NotificationPayloadModel
  | Promise<TransactionQueueModel>
  | TransactionQueueModel
  | OfflineReceiptModel => {
  if ('transactionPayload' in result) {
    const { transactionPayload, details } = result;
    return new TransactionPayloadResultModel({ transactionPayload, details });
  }

  if ('transactions' in result) {
    return resolver(result);
  }

  if ('topicName' in result) {
    return result;
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

export const extractTxOptions = <T extends TransactionBaseDto>(
  params: T
): {
  options: TransactionOptionsDto;
  args: Omit<T, keyof TransactionBaseDto>;
} => {
  const { signer, webhookUrl, dryRun, options, ...args } = params;
  const deprecatedParams = [signer, webhookUrl, dryRun].some(param => !!param);

  if (deprecatedParams && options) {
    throw new AppValidationError(
      '"signer", "webhookUrl", "dryRun" are deprecated and should be nested in "options". These fields are mutually exclusive with "options"'
    );
  }

  if (options) {
    return {
      options,
      args,
    };
  } else {
    if (!signer) {
      throw new AppValidationError('"signer" must be present in transaction requests');
    }

    let processMode = ProcessMode.Submit;
    if (dryRun) {
      processMode = ProcessMode.DryRun;
    } else if (webhookUrl) {
      processMode = ProcessMode.SubmitWithCallback;
    }
    return {
      options: { signer, webhookUrl, processMode },
      args,
    };
  }
};

export const isNotNull = <T>(item: T | null): item is T => item !== null;

export function isFungibleLeg(leg: Leg): leg is FungibleLeg {
  return 'amount' in leg;
}

export function isNftLeg(leg: Leg): leg is NftLeg {
  return 'nfts' in leg;
}

/**
 * helper to clear the event loop. `await` this instead of `setTimeout(fn, 0)`
 */
export async function clearEventLoop(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
}
