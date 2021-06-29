import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class InstructionIdDto {
  @ApiProperty({
    type: 'string',
    description: 'ID of the newly created settlement Instruction',
    example: '123',
  })
  @FromBigNumber()
  readonly instructionId: BigNumber;

  constructor(dto: InstructionIdDto) {
    Object.assign(this, dto);
  }
}
