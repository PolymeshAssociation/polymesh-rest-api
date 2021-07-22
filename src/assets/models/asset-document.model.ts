import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'Hash of the content in the document',
    type: 'string',
    example: '8743b52063cd84097a65d1633f5c74f5',
  })
  readonly contentHash: string;

  @ApiProperty({
    description: 'Type of the document',
    type: 'string',
    nullable: true,
    example: 'Word Document',
  })
  readonly type?: string;

  @ApiProperty({
    description: 'Date at which the document was filed',
    type: 'string',
    nullable: true,
    example: new Date('10/14/1987').toISOString(),
  })
  readonly filedAt?: Date;

  constructor(model: AssetDocumentModel) {
    Object.assign(this, model);
  }
}
