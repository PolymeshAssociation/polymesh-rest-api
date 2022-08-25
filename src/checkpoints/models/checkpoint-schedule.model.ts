/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { CalendarPeriodModel } from '~/checkpoints/models/calendar-period.model';
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

  @ApiProperty({
    description: 'Date at which first Checkpoint was created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly start: Date;

  @ApiProperty({
    description:
      'Date at which the last Checkpoint will be created with this Schedule. A null value means that this Schedule never expires',
    type: 'string',
    nullable: true,
    example: new Date('10/14/1987').toISOString(),
  })
  readonly expiryDate: Date | null;

  @ApiProperty({
    description:
      'Period in which this Schedule creates a Checkpoint. A null value means this Schedule creates a single Checkpoint and then expires',
    nullable: true,
    type: CalendarPeriodModel,
  })
  @Type(() => CalendarPeriodModel)
  readonly period: CalendarPeriodModel | null;

  @ApiProperty({
    description:
      'Abstract measure of the complexity of this Schedule. Shorter periods translate into more complexity',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly complexity: BigNumber;

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
