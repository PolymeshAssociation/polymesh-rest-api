/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MetadataSpecDto {
  @ApiPropertyOptional({
    description: 'URL describing the Asset metadata',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  @IsOptional()
  @IsString()
  readonly url?: string;

  @ApiPropertyOptional({
    description: 'Description about the Asset metadata',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'Type definition describing the metadata',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  @IsOptional()
  @IsString()
  readonly typedef?: string;
}
