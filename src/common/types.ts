import { TxTag } from '@polymathnetwork/polymesh-sdk/types';

export type QueueResult<T> = {
  result: T;
  transactions: {
    blockHash: string;
    transactionHash: string;
    transactionTag: TxTag;
  }[];
};
