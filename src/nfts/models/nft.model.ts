/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';
import { NftMetadataModel } from '~/nfts/models/nft-metadata.model';

export class NftModel {
  @ApiProperty({
    type: 'string',
    description: 'The NFT ID',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The collection (Ticker/Asset ID) of which the NFT belongs to',
  })
  readonly collection: string;

  @ApiProperty({
    description: 'The metadata associated to the NFT',
  })
  readonly metadata: NftMetadataModel[];

  @ApiProperty({
    description:
      'The conventional NFT URI based on global metadata. Will be set if the token has a value for `imageUri` or the collection has a value for `baseImageUri`',
  })
  readonly imageUri: string | null;

  @ApiProperty({
    description:
      'The conventional NFT URI based on global metadata. Will be set if the token has a value for `tokenUri` or the collection has a value for `baseTokenUri`',
  })
  readonly tokenUri: string | null;

  constructor(model: NftModel) {
    const metadata = model.metadata.map(value => new NftMetadataModel(value));
    Object.assign(this, { ...model, metadata });
  }
}
