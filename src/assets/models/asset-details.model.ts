/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Identity,
  KnownAssetType,
  SecurityIdentifier,
} from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntity, FromEntityObject } from '~/common/decorators/transformation';

export class AssetDetailsModel {
  @ApiPropertyOptional({
    description: 'Ticker associated with the Asset',
    type: 'string',
    example: 'TICKER',
  })
  readonly ticker?: string;

  @ApiProperty({
    description: 'The DID of the Asset owner',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly owner: Identity;

  @ApiProperty({
    description: 'The unique Asset ID',
    type: 'string',
    example: '6468aa16-7b77-8fcd-9605-da785c4005a8',
  })
  readonly assetId: string;

  @ApiProperty({
    description: 'Type of the Asset',
    type: 'string',
    enum: KnownAssetType,
    example: KnownAssetType.EquityCommon,
  })
  readonly assetType: string;

  @ApiProperty({
    description: 'Name of the Asset',
    type: 'string',
    example: 'MyAsset',
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
    description: "List of Asset's Security Identifiers",
    isArray: true,
    example: [
      {
        type: 'Isin',
        value: 'US0000000000',
      },
    ],
  })
  @FromEntityObject()
  readonly securityIdentifiers: SecurityIdentifier[];

  @ApiProperty({
    description: 'Current funding round of the Asset',
    type: 'string',
    example: 'Series A',
    nullable: true,
  })
  readonly fundingRound: string | null;

  @ApiProperty({
    description: 'Whether transfers are frozen for the Asset',
    type: 'boolean',
    example: 'true',
  })
  readonly isFrozen: boolean;

  @ApiProperty({
    description: 'List of Agents associated with the Asset',
    type: 'string',
    isArray: true,
    example: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
  })
  readonly agents: string[];

  constructor(model: AssetDetailsModel) {
    Object.assign(this, model);
  }
}
