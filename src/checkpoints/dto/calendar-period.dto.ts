/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsEnum } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { CalendarUnit } from '~/common/types';

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
  @IsBigNumber()
  @ToBigNumber()
  readonly amount: BigNumber;
}
