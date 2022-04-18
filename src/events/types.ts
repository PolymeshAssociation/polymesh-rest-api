import { TransactionStatus, TxTag } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionType } from '~/common/types';
import { EventEntity } from '~/events/entities/event.entity';

export enum EventType {
  TransactionUpdate = 'transaction.update',
}

// transaction.update
interface TransactionSignedPayload {
  transactionHash: string;
}
interface TransactionErrorPayload {
  error: string;
}

type TransactionInBlockPayload = TransactionSignedPayload & {
  blockHash: string;
  blockNumber: string;
};

interface TransactionSucceededPayload extends TransactionInBlockPayload {
  status: TransactionStatus.Succeeded;
  result: unknown;
}
type TransactionFailedPayload = TransactionInBlockPayload &
  TransactionErrorPayload & {
    status: TransactionStatus.Failed;
    error: string;
  };
interface TransactionRejectedPayload extends TransactionErrorPayload {
  status: TransactionStatus.Rejected;
}
type TransactionAbortedPayload = TransactionSignedPayload &
  TransactionErrorPayload & {
    status: TransactionStatus.Aborted;
    error: string;
  };
interface TransactionRunningPayload extends TransactionSignedPayload {
  status: TransactionStatus.Running;
}

type TransactionStatusPayload =
  | TransactionSucceededPayload
  | TransactionFailedPayload
  | TransactionRunningPayload
  | TransactionAbortedPayload
  | TransactionRejectedPayload
  | {
      status: Exclude<
        TransactionStatus,
        | TransactionStatus.Succeeded
        | TransactionStatus.Failed
        | TransactionStatus.Running
        | TransactionStatus.Aborted
      >;
    };

interface SingleTransactionPayload {
  type: TransactionType.Single;
  transactionTag: TxTag;
}
interface BatchTransactionPayload {
  type: TransactionType.Batch;
  transactionTags: TxTag[];
}

export type TransactionTypePayload = SingleTransactionPayload | BatchTransactionPayload;

export type TransactionUpdatePayload = TransactionStatusPayload & TransactionTypePayload;

export interface TransactionUpdateEvent extends EventEntity<TransactionUpdatePayload> {
  readonly type: EventType.TransactionUpdate;
}

// payloads (can be extended in the future)
export type EventPayload = TransactionUpdatePayload;

// maps types to payloads, should be extended
export type GetPayload<T extends EventType> = T extends EventType.TransactionUpdate
  ? TransactionUpdatePayload
  : EventPayload;
