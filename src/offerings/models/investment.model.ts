/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class InvestmentModel {
  @ApiProperty({
    description: 'The DID of the Investor',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly investor: Identity;

  @ApiProperty({
    description: 'The amount sold',
    example: '100',
    type: 'string',
  })
  @FromBigNumber()
  readonly soldAmount: BigNumber;

  @ApiProperty({
    description: 'The amount invested',
    example: '10',
    type: 'string',
  })
  @FromBigNumber()
  readonly investedAmount: BigNumber;

  constructor(model: InvestmentModel) {
    Object.assign(this, model);
  }
}
