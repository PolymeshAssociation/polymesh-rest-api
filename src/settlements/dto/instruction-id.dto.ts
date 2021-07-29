/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Instruction } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class InstructionIdModel extends TransactionQueueModel {
  @ApiProperty({
    type: 'string',
    description: 'ID of the newly created settlement Instruction',
    example: '123',
  })
  @FromEntity()
  readonly instructionId: Instruction;

  constructor(dto: InstructionIdModel) {
    const { transactions, ...rest } = dto;
    super({ transactions });

    Object.assign(this, rest);
  }
}
