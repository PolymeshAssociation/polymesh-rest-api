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
    example:
      'https://www.sec.gov/ix?doc=/Archives/edgar/data/1067983/000156459021009611/brka-10k_20201231.htm',
  })
  @IsString()
  readonly uri: string;

  @ApiProperty({
    description: 'The type of content hash',
    example: 'h512',
  })
  @IsString()
  readonly contentHash: string;

  @ApiPropertyOptional({
    description: 'The type of document',
    example: '10K',
  })
  @IsOptional()
  @IsString()
  readonly type?: string;

  @ApiPropertyOptional({
    description: 'The time the document was filed',
    example: '2021-05-23',
  })
  @IsOptional()
  @IsDate()
  readonly filedAt?: Date;
}
