/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';

export class MetadataSpecModel {
  @ApiPropertyOptional({
    description: 'Off-chain specs or documentation link',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  readonly url?: string;

  @ApiPropertyOptional({
    description: 'Description of metadata type',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'SCALE encoded `AssetMetadataTypeDef`',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  readonly typedef?: string;

  constructor(model: MetadataSpecModel) {
    Object.assign(this, model);
  }
}
