/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MetadataSpecDto {
  @ApiPropertyOptional({
    description: 'Off-chain specs or documentation link',
    type: 'string',
    example: 'https://example.com',
  })
  @IsOptional()
  @IsString()
  readonly url?: string;

  @ApiPropertyOptional({
    description: 'Description of the Metadata type',
    type: 'string',
    example: 'Some description',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description:
      '[SCALE](https://wiki.polkadot.network/docs/build-tools-index#scale-codec) encoded `AssetMetadataTypeDef`',
    type: 'string',
    example: 'Some example',
  })
  @IsOptional()
  @IsString()
  readonly typedef?: string;
}
