/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class ScheduleNextCheckpointModel {
  @ApiProperty({
    description: 'The ID of the Checkpoint Schedule',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The next Checkpoint creation date for this Schedule',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly nextAt: Date;

  constructor(model: ScheduleNextCheckpointModel) {
    Object.assign(this, model);
  }
}
