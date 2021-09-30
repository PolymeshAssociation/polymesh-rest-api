/* istanbul ignore file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsHexadecimal, IsOptional, IsString, Length, Matches } from 'class-validator';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';

export class AssetDocumentDto {
  @ApiProperty({
    description: 'The name of the document',
    example: 'Annual report, 2021',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'URI (Uniform Resource Identifier) of the document',
    example: 'https://example.com/sec/10k-05-23-2021.htm',
  })
  @IsString()
  readonly uri: string;

  @ApiPropertyOptional({
    description:
      "Hash of the document's content. Used to verify the integrity of the document pointed at by the URI",
    example: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
  })
  @IsOptional()
  @IsHexadecimal({
    message: 'Content Hash must be a hexadecimal number',
  })
  @Matches(/^0x.+/, {
    message: 'Content Hash must start with "0x"',
  })
  @Length(MAX_CONTENT_HASH_LENGTH, undefined, {
    message: `Content Hash must be ${MAX_CONTENT_HASH_LENGTH} characters long`,
  })
  readonly contentHash?: string;

  @ApiPropertyOptional({
    description: 'The type of document',
    example: '10K',
  })
  @IsOptional()
  readonly type?: string;

  @ApiPropertyOptional({
    description: 'Date at which the document was filed',
    example: new Date('05/23/2021').toISOString(),
    type: 'string',
  })
  @IsOptional()
  @IsDate()
  readonly filedAt?: Date;
}
