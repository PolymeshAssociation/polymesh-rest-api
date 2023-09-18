import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { GroupedInstructions } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntityObject } from '~/common/decorators/transformation';

export class GroupedInstructionModel {
  @ApiProperty({
    description: 'List of affirmed Instruction ids',
    isArray: true,
    type: 'number',
    example: [123],
  })
  @FromEntityObject()
  readonly affirmed: BigNumber[];

  @ApiProperty({
    description: 'List of pending Instruction ids',
    isArray: true,
    type: 'number',
    example: [123],
  })
  @FromEntityObject()
  readonly pending: BigNumber[];

  @ApiProperty({
    description: 'List of failed Instruction ids',
    isArray: true,
    type: 'number',
    example: [123],
  })
  @FromEntityObject()
  readonly failed: BigNumber[];

  constructor(instructions: GroupedInstructions) {
    Object.assign(this, instructions);
  }
}
