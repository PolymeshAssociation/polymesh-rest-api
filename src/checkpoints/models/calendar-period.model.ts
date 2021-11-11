/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';

export class CalendarPeriodModel {
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
