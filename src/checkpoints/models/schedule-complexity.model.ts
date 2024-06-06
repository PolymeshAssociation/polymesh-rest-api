/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class ScheduleComplexityModel {
  @ApiProperty({
    description: 'ID of the Schedule',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'Maximum allowed complexity for the Schedule',
    type: 'string',
    example: '50',
  })
  @FromBigNumber()
  readonly maxComplexity: BigNumber;

  @ApiProperty({
    description: 'Current complexity of the Schedule (pending checkpoints)',
    type: 'string',
    example: '3',
  })
  @FromBigNumber()
  readonly currentComplexity: BigNumber;

  constructor(model: ScheduleComplexityModel) {
    Object.assign(this, model);
  }
}
