/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity, KnownTokenType, TokenIdentifier } from '@polymathnetwork/polymesh-sdk/types';

import { FromBigNumber, FromEntity, FromEntityObject } from '~/common/decorators/transformation';

export class AssetDetailsModel {
  @ApiProperty({
    description: 'The DID of the Asset owner',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly owner: Identity;

  @ApiProperty({
    description: 'Type of the Asset',
    type: 'string',
    enum: KnownTokenType,
    example: KnownTokenType.EquityCommon,
  })
  readonly assetType: string;

  @ApiProperty({
    description: 'Name of the Asset',
    type: 'string',
    example: 'MyToken',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Total supply count of the Asset',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  readonly totalSupply: BigNumber;

  @ApiProperty({
    description: 'Indicator to know if Asset is divisible or not',
    type: 'boolean',
    example: 'false',
  })
  readonly isDivisible: boolean;

  @ApiProperty({
    description: 'List of Asset identifiers',
    isArray: true,
    example: [
      {
        type: 'Isin',
        value: 'US0000000000',
      },
    ],
  })
  @FromEntityObject()
  readonly identifiers: TokenIdentifier[];

  @ApiProperty({
    description: 'Current funding round of the Asset',
    type: 'string',
    example: 'Series A',
  })
  readonly fundingRound: string | null;

  constructor(model: AssetDetailsModel) {
    Object.assign(this, model);
  }
}
