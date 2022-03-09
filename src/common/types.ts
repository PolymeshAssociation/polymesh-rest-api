/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TxTag } from '@polymathnetwork/polymesh-sdk/types';

import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionModel } from '~/common/models/transaction.model';

export type Transaction = {
  blockHash: string;
  transactionHash: string;
  blockNumber: BigNumber;
} & (
  | {
      transactionTag: TxTag;
    }
  | {
      transactionTags: TxTag[];
    }
);

export type QueueResult<T> = {
  result: T;
  transactions: (TransactionModel | BatchTransactionModel)[];
};

export interface Entity<Serialized> {
  uuid: string;

  toJson(): Serialized;
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Class<T extends {} = {}> = new (...args: any[]) => T;

export enum TransactionType {
  Single = 'single',
  Batch = 'batch',
}
