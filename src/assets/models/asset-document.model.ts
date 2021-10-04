/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';

export class AssetDocumentModel {
  @ApiProperty({
    description: 'Name of the document',
    example: 'Annual report, 2021',
  })
  readonly name: string;

  @ApiProperty({
    description: 'URI (Uniform Resource Identifier) of the document',
    example: 'https://example.com/sec/10k-05-23-2021.htm',
  })
  readonly uri: string;

  @ApiPropertyOptional({
    description:
      "Hash of the document's content. Used to verify the integrity of the document pointed at by the URI",
    example: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
  })
  readonly contentHash?: string;

  @ApiPropertyOptional({
    description: 'Type of the document',
    example: 'Private Placement Memorandum',
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
