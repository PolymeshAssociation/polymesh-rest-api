/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Transform } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';

export class TickerRegistrationConfigModel {
  @ApiProperty({
    description: 'Maximum allowed length for a ticker',
    type: 'string',
    example: '12',
  })
  @FromBigNumber()
  readonly maxTickerLength: BigNumber;

  @ApiPropertyOptional({
    description:
      'Amount of time (in milliseconds) a ticker reservation is valid for before it expires, starting from the moment it is reserved. Null if ticker reservations never expire',
    type: 'string',
    nullable: true,
    example: '5184000000',
  })
  @Transform(({ value }: { value: BigNumber | null }) => (value ? value.toString() : null))
  readonly registrationLength: BigNumber | null;

  constructor(model: TickerRegistrationConfigModel) {
    Object.assign(this, model);
  }
}
