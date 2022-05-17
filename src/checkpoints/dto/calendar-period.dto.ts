/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsNumber } from '~/common/decorators/validation';

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
    type: 'string',
    example: '3',
  })
  @IsNumber()
  @ToBigNumber()
  readonly amount: BigNumber;
}
