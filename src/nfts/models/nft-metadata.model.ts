/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { NftMetadataKeyModel } from '~/nfts/models/nft-metadata-key.model';

export class NftMetadataModel {
  @ApiProperty({
    description: 'Value of the tokens metadata',
    type: 'string',
    example: 'https://example.com',
  })
  readonly value: string;

  @ApiProperty({
    description: 'The metadata entry ID',
    type: NftMetadataKeyModel,
  })
  key: NftMetadataKeyModel;

  constructor(model: NftMetadataModel) {
    const key = new NftMetadataKeyModel(model.key);
    Object.assign(this, { ...model, key });
  }
}
