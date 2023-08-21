/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { CalendarUnit } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

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
    type: 'string',
    example: '3',
  })
  @FromBigNumber()
  readonly amount: BigNumber;
}
