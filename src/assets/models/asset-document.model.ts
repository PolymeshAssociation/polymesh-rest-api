/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';

export class AssetDocumentModel {
  @ApiProperty({
    description: 'Name of the document',
    type: 'string',
    example: 'DOC-NAME',
  })
  readonly name: string;

  @ApiProperty({
    description: 'URI(Uniform Resource Identifier) of the document',
    type: 'string',
    example: 'example.doc',
  })
  readonly uri: string;

  @ApiPropertyOptional({
    description: 'Hash of the content in the document',
    type: 'string',
    example: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
  })
  readonly contentHash?: string;

  @ApiPropertyOptional({
    description: 'Type of the document',
    type: 'string',
    example: 'Word Document',
  })
  readonly type?: string;

  @ApiPropertyOptional({
    description: 'Date at which the document was filed',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly filedAt?: Date;

  constructor(model: AssetDocumentModel) {
    Object.assign(this, model);
  }
}
