/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class RelockStatusModel {
  @ApiPropertyOptional({
    description:
      'Date and time when the Instruction was last unlocked by a mediator, null if it has never been unlocked',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  readonly unlockedAt: Date | null;

  @ApiPropertyOptional({
    description: 'The number of times the Instruction has been relocked',
    type: 'string',
    example: '0',
  })
  @FromBigNumber()
  readonly relockCount: BigNumber;

  @ApiPropertyOptional({
    description: 'The maximum number of times the Instruction can be relocked',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly maxRelockCount: BigNumber;

  @ApiPropertyOptional({
    description:
      'Date and time after which the Instruction can be locked again, null if it has never been unlocked',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  readonly cooldownEndsAt: Date | null;

  constructor(model: RelockStatusModel) {
    Object.assign(this, model);
  }
}
