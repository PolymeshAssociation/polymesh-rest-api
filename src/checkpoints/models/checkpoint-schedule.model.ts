/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class CheckpointScheduleModel {
  @ApiProperty({
    description: 'ID of the Schedule',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'Ticker of the Asset whose Checkpoints will be created with this Schedule',
    type: 'string',
    example: 'TICKER',
  })
  readonly ticker: string;

  // @ApiProperty({
  //   description: 'Date at which first Checkpoint was created',
  //   type: 'string',
  //   example: new Date('10/14/1987').toISOString(),
  // })
  // readonly start: Date;

  @ApiProperty({
    description: 'Date at which the last Checkpoint will be created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly expiryDate: Date;

  @ApiProperty({
    description: 'Dates at which checkpoints will be created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly pendingPoints: Date[];

  @ApiProperty({
    description: 'Number of Checkpoints left to be created by the Schedule',
    type: 'string',
    example: '10',
  })
  @FromBigNumber()
  readonly remainingCheckpoints: BigNumber;

  @ApiProperty({
    description: 'Date when the next Checkpoint will be created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly nextCheckpointDate: Date;

  constructor(model: CheckpointScheduleModel) {
    Object.assign(this, model);
  }
}
