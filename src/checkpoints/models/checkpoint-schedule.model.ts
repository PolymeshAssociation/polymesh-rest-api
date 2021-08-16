/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';

class CalendarPeriodModel {
  @ApiProperty({
    description: 'Unit of the period',
    type: 'string',
    enum: CalendarUnit,
    example: CalendarUnit.Month,
  })
  readonly unit: CalendarUnit;

  @ApiProperty({
    description: 'Number of units',
    type: 'number',
    example: 3,
  })
  readonly amount: number;
}

export class CheckpointScheduleModel {
  @ApiProperty({
    description: 'ID of the Schedule',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly id: BigNumber;

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
    type: 'number',
    example: 1,
  })
  readonly complexity: number;

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

  constructor(model: CheckpointScheduleModel) {
    Object.assign(this, model);
  }
}
