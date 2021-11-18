/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsNumber } from 'class-validator';

export class CalendarPeriodDto {
  @ApiProperty({
    description: 'Unit of the period',
    type: 'string',
    enum: CalendarUnit,
    example: CalendarUnit.Month,
  })
  @IsEnum(CalendarUnit)
  readonly unit: CalendarUnit;

  @ApiProperty({
    description: 'Number of units',
    type: 'number',
    example: 3,
  })
  @IsNumber()
  readonly amount: number;
}
