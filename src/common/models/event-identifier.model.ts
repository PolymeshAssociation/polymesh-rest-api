/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class EventIdentifierModel {
  @ApiProperty({
    description: 'Number of the block where the event resides',
    type: 'string',
    example: '1000000',
  })
  @FromBigNumber()
  readonly blockNumber: BigNumber;

  @ApiProperty({
    description: 'Hash of the block where the event resides',
    type: 'string',
    example: '0x9d05973b0bacdbf26b705358fbcb7085354b1b7836ee1cc54e824810479dccf6',
  })
  readonly blockHash: string;

  @ApiProperty({
    description: 'Date when the block was finalized',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly blockDate: Date;

  @ApiProperty({
    description: 'Index of the event in the block',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly eventIndex: BigNumber;

  constructor(model: EventIdentifierModel) {
    Object.assign(this, model);
  }
}
