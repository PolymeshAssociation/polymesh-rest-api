/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';

export class MetadataSpecModel {
  @ApiPropertyOptional({
    description: 'Off-chain specs or documentation link',
    type: 'string',
    example: 'https://example.com',
  })
  readonly url?: string;

  @ApiPropertyOptional({
    description: 'Description of the Metadata type',
    type: 'string',
    example: 'Some description',
  })
  readonly description?: string;

  @ApiPropertyOptional({
    description:
      '[SCALE](https://wiki.polkadot.network/docs/build-tools-index#scale-codec) encoded `AssetMetadataTypeDef`',
    type: 'string',
    example: 'https://example.com',
  })
  readonly typedef?: string;

  constructor(model: MetadataSpecModel) {
    Object.assign(this, model);
  }
}
