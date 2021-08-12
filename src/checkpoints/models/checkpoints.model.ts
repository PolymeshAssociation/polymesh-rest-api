/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class CheckpointDetailsModel {
  @ApiProperty({
    description: 'ID of the Checkpoint',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'Date at which Checkpoint is created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Total supply of the Asset at this Checkpoint',
    type: 'string',
    example: '10000',
  })
  @FromBigNumber()
  totalSupply: BigNumber;

  constructor(model: CheckpointDetailsModel) {
    Object.assign(this, model);
  }
}
