/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class AssetDocumentDto {
  @ApiProperty({
    description: 'The name of the document',
    example: 'Annual report, 2021',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'The URI of the document',
    example: 'https://example.com/sec/10k-05-23-2021.htm',
  })
  @IsString()
  readonly uri: string;

  @ApiPropertyOptional({
    description: 'The type of content hash',
    example: 'h512',
  })
  @IsString()
  readonly contentHash?: string;

  @ApiPropertyOptional({
    description: 'The type of document',
    example: '10K',
  })
  @IsOptional()
  @IsString()
  readonly type?: string;

  @ApiPropertyOptional({
    description: 'The time the document was filed',
    example: new Date('05/23/2021').toISOString(),
    type: 'string',
  })
  @IsOptional()
  @IsDate()
  readonly filedAt?: Date;
}
