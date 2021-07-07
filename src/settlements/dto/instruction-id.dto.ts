/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';
import { TransactionQueueDto } from '~/common/dto/transaction-queue.dto';

export class InstructionIdDto extends TransactionQueueDto {
  @ApiProperty({
    type: 'string',
    description: 'ID of the newly created settlement Instruction',
    example: '123',
  })
  @FromBigNumber()
  readonly instructionId: BigNumber;

  constructor(dto: InstructionIdDto) {
    super();
    Object.assign(this, dto);
  }
}
