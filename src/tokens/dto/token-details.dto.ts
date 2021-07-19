/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity, KnownTokenType } from '@polymathnetwork/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class TokenDetailsDto {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly owner: Identity;

  @ApiProperty({
    example: KnownTokenType.EquityCommon,
  })
  readonly assetType: string;

  @ApiProperty({
    example: 'MyToken',
  })
  readonly name: string;

  @ApiProperty({ type: 'string', example: '1000' })
  @FromBigNumber()
  readonly totalSupply: BigNumber;

  readonly isDivisible: boolean;

  constructor(dto: TokenDetailsDto) {
    Object.assign(this, dto);
  }
}
