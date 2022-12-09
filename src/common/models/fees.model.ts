/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class FeesModel {
  @ApiProperty({
    type: 'string',
    description: 'The amount of POLYX that will be charged for the transaction as protocol fee',
    example: '0.5',
  })
  @FromBigNumber()
  readonly protocol: BigNumber;

  @ApiProperty({
    type: 'string',
    description: 'The amount of POLYX that will be charged for the transaction as GAS fee',
    example: '0.5',
  })
  @FromBigNumber()
  readonly gas: BigNumber;

  @ApiProperty({
    type: 'string',
    description: 'The total amount of POLYX that will be charged for the transaction',
    example: '1',
  })
  @FromBigNumber()
  readonly total: BigNumber;

  constructor(model: FeesModel) {
    Object.assign(this, model);
  }
}
