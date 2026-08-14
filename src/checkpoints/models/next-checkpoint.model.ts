/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { ScheduleNextCheckpointModel } from '~/checkpoints/models/schedule-next-checkpoint.model';
import { FromBigNumber } from '~/common/decorators/transformation';

export class NextCheckpointModel {
  @ApiProperty({
    description: 'The closest upcoming Checkpoint creation date across all active Schedules',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly nextAt: Date;

  @ApiProperty({
    description: 'The total amount of pending Checkpoints across all active Schedules',
    type: 'string',
    example: '3',
  })
  @FromBigNumber()
  readonly totalPending: BigNumber;

  @ApiProperty({
    description: 'The next Checkpoint creation date for each active Schedule',
    type: () => ScheduleNextCheckpointModel,
    isArray: true,
  })
  @Type(() => ScheduleNextCheckpointModel)
  readonly schedules: ScheduleNextCheckpointModel[];

  constructor(model: NextCheckpointModel) {
    Object.assign(this, model);
  }
}
