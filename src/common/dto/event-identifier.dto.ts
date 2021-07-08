/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class EventIdentifierDto {
  @ApiProperty({
    type: 'string',
    description: 'Number of the block where the event was emitted',
    example: '123',
  })
  @FromBigNumber()
  readonly blockNumber: BigNumber;

  @ApiProperty({
    type: 'string',
    description: 'Date of the block where the event was emitted',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly blockDate: Date;

  @ApiProperty({
    type: 'number',
    description: 'Index of the event within the block',
    example: 10,
  })
  readonly eventIndex: number;
}
