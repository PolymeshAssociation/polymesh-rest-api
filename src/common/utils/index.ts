import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ModuleName } from '@polymathnetwork/polymesh-sdk/polkadot';
import {
  ErrorCode,
  ProcedureMethod,
  ProcedureOpts,
  TxTags,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';
import { flatten } from 'lodash';

import { QueueResult } from '~/common/types';

export async function processQueue<MethodArgs, ReturnType>(
  method: ProcedureMethod<MethodArgs, unknown, ReturnType>,
  args: MethodArgs,
  opts: ProcedureOpts
): Promise<QueueResult<ReturnType>> {
  try {
    const queue = await method(args, opts);
    const result = await queue.run();

    return {
      result,
      transactions: queue.transactions.map(({ blockHash, txHash, tag }) => ({
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        blockHash: blockHash!,
        transactionHash: txHash!,
        transactionTag: tag,
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      })),
    };
  } catch (err) /* istanbul ignore next: not worth the trouble */ {
    if (isPolymeshError(err)) {
      const { message, code } = err;
      const errorMessage = message.replace(/Security Token/g, 'Asset');
      switch (code) {
        case ErrorCode.ValidationError:
          throw new BadRequestException(errorMessage);
        case ErrorCode.InsufficientBalance:
        case ErrorCode.UnmetPrerequisite:
          throw new UnprocessableEntityException(errorMessage);
        case ErrorCode.DataUnavailable:
          throw new NotFoundException(errorMessage);
        default:
          throw new InternalServerErrorException(errorMessage);
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
