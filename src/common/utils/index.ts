import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  ErrorCode,
  ModuleName,
  ProcedureMethod,
  ProcedureOpts,
  TxTags,
} from '@polymathnetwork/polymesh-sdk/types';
import {
  isPolymeshError,
  isPolymeshTransaction,
  isPolymeshTransactionBatch,
} from '@polymathnetwork/polymesh-sdk/utils';
import { flatten } from 'lodash';

import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionModel } from '~/common/models/transaction.model';
import { QueueResult, Transaction } from '~/common/types';

export async function processQueue<MethodArgs, ReturnType>(
  method: ProcedureMethod<MethodArgs, unknown, ReturnType>,
  args: MethodArgs,
  opts: ProcedureOpts
): Promise<QueueResult<ReturnType>> {
  try {
    const queue = await method(args, opts);
    const result = await queue.run();

    const assembleTransaction = (transaction: unknown) => {
      let tagDetails;
      if (isPolymeshTransaction(transaction)) {
        const { tag } = transaction;
        tagDetails = { transactionTag: tag };
      } else if (isPolymeshTransactionBatch(transaction)) {
        const { transactions } = transaction;
        tagDetails = {
          transactionTags: transactions.map(({ tag }) => tag),
        };
      } else {
        throw new Error(
          'Unsupported transaction details received. Please report this issue to the Polymath team'
        );
      }

      const { blockHash, txHash, blockNumber } = transaction;
      return {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        blockHash: blockHash!,
        transactionHash: txHash!,
        blockNumber: new BigNumber(blockNumber || 0),
        ...tagDetails,
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      };
    };

    return {
      result,
      transactions: queue.transactions.map(assembleTransaction),
    };
  } catch (err) /* istanbul ignore next: not worth the trouble */ {
    if (isPolymeshError(err)) {
      const { message, code } = err;
      switch (code) {
        case ErrorCode.ValidationError:
          throw new BadRequestException(message);
        case ErrorCode.InsufficientBalance:
        case ErrorCode.UnmetPrerequisite:
          throw new UnprocessableEntityException(message);
        case ErrorCode.DataUnavailable:
          throw new NotFoundException(message);
        default:
          throw new InternalServerErrorException(message);
      }
    }
    throw new InternalServerErrorException(err.message);
  }
}

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

export function createTransactionQueueModel(
  transactions: Transaction[]
): (TransactionModel | BatchTransactionModel)[] {
  return transactions.map(transaction => {
    if ('transactionTag' in transaction) {
      return new TransactionModel(transaction);
    }
    return new BatchTransactionModel(transaction);
  });
}
