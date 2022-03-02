/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber, ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

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
    description: 'Index of the event within the block',
    type: 'string',
    example: '10',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly eventIndex: BigNumber;
}
