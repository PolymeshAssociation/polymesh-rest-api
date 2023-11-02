/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class MetadataValueDto {
  @ApiProperty({
    description: 'Whether the value if for a local or global metadata entry',
    enum: MetadataType,
    example: MetadataType.Local,
  })
  @IsEnum(MetadataType)
  readonly type: MetadataType;

  @ApiProperty({
    description: 'The ID of the metadata entry the value is for',
    type: 'string',
    example: '1',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The value for the metadata entry',
    example: 'https://example.com/nfts/1',
  })
  @IsString()
  readonly value: string;
}
