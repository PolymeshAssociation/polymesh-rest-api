/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  DefaultPortfolio,
  NumberedPortfolio,
  SecurityToken,
} from '@polymathnetwork/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class LegModel {
  @ApiProperty({
    description: 'Portfolio from which the transfer is to be made',
    example: {
      did: '0x0000000000000000000000000000000000000000000000000000000000000000',
      id: '1',
    },
  })
  @FromEntity()
  readonly from: DefaultPortfolio | NumberedPortfolio;

  @ApiProperty({
    description: 'Portfolio to which the transfer is to be made',
    example: {
      did: '0x0600000000000000000000000000000000000000000000000000000000000000',
    },
  })
  @FromEntity()
  readonly to: DefaultPortfolio | NumberedPortfolio;

  @ApiProperty({
    description: 'Amount to be transferred',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description: 'Asset to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  @FromEntity()
  readonly asset: SecurityToken;

  constructor(model: LegModel) {
    Object.assign(this, model);
  }
}
