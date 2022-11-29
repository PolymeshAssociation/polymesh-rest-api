import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ErrorCode,
  GenericPolymeshTransaction,
  NoArgsProcedureMethod,
  ProcedureMethod,
  ProcedureOpts,
} from '@polymeshassociation/polymesh-sdk/types';
import {
  isPolymeshError,
  isPolymeshTransaction,
  isPolymeshTransactionBatch,
} from '@polymeshassociation/polymesh-sdk/utils';

import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionModel } from '~/common/models/transaction.model';

export type TransactionResult<T> = {
  result: T;
  transactions: (TransactionModel | BatchTransactionModel)[];
};

type WithArgsProcedureMethod<T> = T extends NoArgsProcedureMethod<unknown, unknown> ? never : T;

export type Method<M, R, T> = WithArgsProcedureMethod<ProcedureMethod<M, R, T>>;

/**
 * a helper function to handle when procedures have args and those without args
 */
export function prepareProcedure<MethodArgs, ReturnType, TransformedReturnType = ReturnType>(
  method: Method<MethodArgs, ReturnType, TransformedReturnType>,
  args: MethodArgs,
  opts: ProcedureOpts
): Promise<GenericPolymeshTransaction<ReturnType, TransformedReturnType>> {
  let procedure;
  if (!args || Object.keys(args).length === 0) {
    procedure = method(opts as MethodArgs);
  } else {
    procedure = method(args, opts);
  }
  return procedure;
}

export async function processTransaction<
  MethodArgs,
  ReturnType,
  TransformedReturnType = ReturnType
>(
  method: Method<MethodArgs, ReturnType, TransformedReturnType>,
  args: MethodArgs,
  opts: ProcedureOpts
): Promise<TransactionResult<TransformedReturnType>> {
  try {
    const procedure = await prepareProcedure(method, args, opts);
    const result = await procedure.run();

    const assembleTransactionResponse = <T, R = T>(
      transaction: GenericPolymeshTransaction<T, R>
    ): TransactionModel | BatchTransactionModel => {
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
          'Unsupported transaction details received. Please report this issue to the Polymesh team'
        );
      }
      const { blockHash, txHash, blockNumber } = transaction;
      const constructorParams = {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        blockHash: blockHash!,
        transactionHash: txHash!,
        blockNumber: blockNumber!,
        ...tagDetails,
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      };

      if ('transactionTag' in constructorParams) {
        return new TransactionModel(constructorParams);
      }
      return new BatchTransactionModel(constructorParams);
    };

    return {
      result,
      transactions: [assembleTransactionResponse(procedure)],
    };
  } catch (err) /* istanbul ignore next: not worth the trouble */ {
    handleSdkError(err as any);
  }
}

export function handleSdkError(err: Error): never {
  if (isPolymeshError(err)) {
    const { message, code } = err;
    switch (code) {
      case ErrorCode.NoDataChange:
      case ErrorCode.ValidationError:
        throw new BadRequestException(message);
      case ErrorCode.InsufficientBalance:
      case ErrorCode.UnmetPrerequisite:
      case ErrorCode.LimitExceeded:
        throw new UnprocessableEntityException(message);
      case ErrorCode.DataUnavailable:
        throw new NotFoundException(message);
      default:
        throw new InternalServerErrorException(message);
    }
  }
  throw new InternalServerErrorException(err.message);
}
