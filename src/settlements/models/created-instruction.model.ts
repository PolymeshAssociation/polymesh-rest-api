/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Instruction } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedInstructionModel extends TransactionQueueModel {
  @ApiProperty({
    type: 'string',
    description: 'ID of the newly created settlement Instruction',
    example: '123',
  })
  @FromEntity()
  readonly instruction: Instruction;

  constructor(model: CreatedInstructionModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
