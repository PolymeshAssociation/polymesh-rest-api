import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TxTag } from '@polymathnetwork/polymesh-sdk/types';

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
  transactions: Transaction[];
};

export interface Entity<Serialized> {
  uuid: string;

  toJson(): Serialized;
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Class<T extends {} = {}> = new (...args: any[]) => T;
