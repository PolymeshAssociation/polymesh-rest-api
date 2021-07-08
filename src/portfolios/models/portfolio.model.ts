/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';
import { IdentityModel } from '~/identities/models/identity.model';
import { TokenBalanceModel } from '~/tokens/models/token-balance.model';

export class PortfolioModel {
  @ApiProperty({
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  did?: string;

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
    type: IdentityModel,
  })
  custodian?: IdentityModel;

  @ApiProperty({
    description: 'Owner details of the portfolio',
    type: IdentityModel,
  })
  owner?: IdentityModel;
}
