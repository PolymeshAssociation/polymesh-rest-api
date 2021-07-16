/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Instruction } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueDto } from '~/common/dto/transaction-queue.dto';

export class InstructionIdDto extends TransactionQueueDto {
  @ApiProperty({
    type: 'string',
    description: 'ID of the newly created settlement Instruction',
    example: '123',
  })
  @FromEntity()
  readonly instructionId: Instruction;

  constructor(dto: InstructionIdDto) {
    super();
    Object.assign(this, dto);
  }
}
