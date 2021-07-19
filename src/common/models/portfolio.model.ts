/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { TokenBalanceModel } from '~/tokens/models/token-balance.model';

export class PortfolioModel {
  @ApiProperty({
    nullable: true,
    example: '123',
    description: 'Portfolio number, do not send any value for the Default Portfolio',
  })
  @FromBigNumber()
  id?: BigNumber;

  @ApiProperty({
    example: 'ABC',
    description: 'Name of the portfolio',
  })
  name?: string;

  @ApiProperty({
    description: 'List of balances for each token in the portfolio',
    type: TokenBalanceModel,
  })
  tokenBalances?: TokenBalanceModel[];

  @ApiProperty({
    description: 'Details of the custodian of the portfolio',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  custodian?: Identity;

  @ApiProperty({
    description: 'Owner details of the portfolio',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  owner?: Identity;

  constructor(model?: PortfolioModel) {
    Object.assign(this, model);
  }
}
