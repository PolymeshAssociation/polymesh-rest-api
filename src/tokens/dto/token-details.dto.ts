import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity, KnownTokenType } from '@polymathnetwork/polymesh-sdk/types';
import { Transform } from 'class-transformer';

export class TokenDetailsDto {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @Transform(({ value }) => value.did)
  owner: Identity;

  @ApiProperty({
    example: KnownTokenType.EquityCommon,
  })
  assetType: string;

  @ApiProperty({
    example: 'MyToken',
  })
  name: string;

  @ApiProperty({ type: 'string', example: '1000' })
  @Transform(({ value }) => value.toString())
  totalSupply: BigNumber;

  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    description: 'Primary issuance agent',
  })
  @Transform(({ value }) => value.did)
  pia: Identity;

  isDivisible: boolean;

  constructor(dto: TokenDetailsDto) {
    Object.assign(this, dto);
  }
}
