import { TxTag } from '@polymathnetwork/polymesh-sdk/types';

export type QueueResult<T> = {
  result: T;
  transactions: {
    blockHash: string;
    transactionHash: string;
    transactionTag: TxTag;
  }[];
};

export interface Entity<Serialized> {
  uuid: string;

  toJson(): Serialized;
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Class<T extends {} = {}> = new (...args: any[]) => T;
