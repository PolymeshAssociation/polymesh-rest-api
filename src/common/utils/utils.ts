import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import {
  ErrorCode,
  isPolymeshError,
  ProcedureMethod,
  ProcedureOpts,
} from '@polymathnetwork/polymesh-sdk/types';

import { QueueResult } from '~/common/types';

export async function processQueue<MethodArgs, ReturnType>(
  method: ProcedureMethod<MethodArgs, unknown, ReturnType>,
  args: MethodArgs,
  opts: ProcedureOpts
): Promise<QueueResult<ReturnType>> {
  // TODO @monitz87: Improve error handling
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
      switch (code) {
        case ErrorCode.ValidationError:
          throw new BadRequestException(message);
        default:
          throw new InternalServerErrorException(message);
      }
    }
    throw new InternalServerErrorException(err.message);
  }
}
