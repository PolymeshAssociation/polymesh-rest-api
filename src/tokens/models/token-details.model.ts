/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity, KnownTokenType } from '@polymathnetwork/polymesh-sdk/types';

export class TokenDetailsModel {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  owner: Identity;

  @ApiProperty({
    example: KnownTokenType.EquityCommon,
  })
  assetType: string;

  @ApiProperty({
    example: 'MyToken',
  })
  name: string;

  @ApiProperty({
    type: 'string',
    example: '1000',
  })
  totalSupply: BigNumber;

  @ApiProperty({
    type: 'boolean',
    example: 'false',
  })
  isDivisible: boolean;

  constructor(dto?: TokenDetailsModel) {
    Object.assign(this, dto);
  }
}
