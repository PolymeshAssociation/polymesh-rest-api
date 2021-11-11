/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';

export class CheckpointScheduleDetailsModel extends CheckpointScheduleModel {
  @ApiProperty({
    description: 'Number of Checkpoints left to be created by the Schedule',
    type: 'number',
    example: 10,
  })
  readonly remainingCheckpoints: number;

  @ApiProperty({
    description: 'Date when the next Checkpoint will be created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly nextCheckpointDate: Date;

  constructor(model: CheckpointScheduleDetailsModel) {
    const { id, ticker, start, expiryDate, period, complexity, ...rest } = model;

    super({
      id,
      ticker,
      start,
      expiryDate,
      period,
      complexity,
    });

    Object.assign(this, rest);
  }
}
