/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Instruction } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntityObject } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class TransferFundsResultModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    type: 'string',
    description:
      'ID of the settlement Instruction awaiting the receiving Identity affirmation. Absent when the transfer settled immediately, which is the case for a transfer within the same Identity or when the receiving Identity has automatic affirmation enabled',
    example: '123',
  })
  @FromEntityObject()
  readonly instruction?: Instruction;

  constructor(model: TransferFundsResultModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
