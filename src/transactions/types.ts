import {
  PolymeshTransaction,
  PolymeshTransactionBatch,
} from '@polymeshassociation/polymesh-sdk/types';

export enum ResultType {
  Direct = 'direct',
  MultiSigProposal = 'MultiSigProposal',
}

export type Transaction = PolymeshTransaction | PolymeshTransactionBatch;
