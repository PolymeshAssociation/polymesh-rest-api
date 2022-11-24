/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MetadataSpecDto {
  @ApiPropertyOptional({
    description: 'Off-chain specs or documentation link',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  @IsOptional()
  @IsString()
  readonly url?: string;

  @ApiPropertyOptional({
    description: 'Description of metadata type',
    type: 'string',
    example: 'Some description',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'SCALE encoded `AssetMetadataTypeDef`',
    type: 'string',
    example: 'Some example',
  })
  @IsOptional()
  @IsString()
  readonly typedef?: string;
}
