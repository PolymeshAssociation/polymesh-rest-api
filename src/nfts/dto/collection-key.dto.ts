/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, IsString, ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { MetadataSpecDto } from '~/metadata/dto/metadata-spec.dto';

export class CollectionKeyDto {
  @ApiProperty({
    description:
      'Whether the metadata key is local or global. Local values will be created with the collection, while global values must already exist',
    example: MetadataType.Local,
  })
  @IsEnum(MetadataType)
  readonly type: MetadataType;

  @ApiPropertyOptional({
    description: 'The ID of the global metadata. Required when type is Global',
    type: 'string',
    example: '1',
  })
  @ValidateIf(({ type }) => type === MetadataType.Global)
  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;

  @ApiPropertyOptional({
    description: 'The specification for a local metadata value. Required when type is Local',
    type: MetadataSpecDto,
  })
  @ValidateIf(({ type }) => type === MetadataType.Local)
  @Type(() => MetadataSpecDto)
  readonly spec: MetadataSpecDto;

  @ApiPropertyOptional({
    description: 'The name of the local metadata value. Required when type is Local',
    example: 'Info',
    type: 'string',
  })
  @ValidateIf(({ type }) => type === MetadataType.Local)
  @IsString()
  readonly name?: string;
}
