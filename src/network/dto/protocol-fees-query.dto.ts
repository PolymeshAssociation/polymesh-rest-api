/* istanbul ignore file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TxTag, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

import { IsTxTag } from '~/common/decorators/validation';
import { getTxTags, toArray } from '~/common/utils';

export class ProtocolFeesQueryDto {
  @ApiProperty({
    description: 'Transaction tags whose protocol fees should be returned',
    isArray: true,
    enum: getTxTags(),
    example: [TxTags.asset.CreateAsset],
  })
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsTxTag({ each: true })
  readonly tags: TxTag[];

  @ApiPropertyOptional({
    description: 'Optional block hash to query historic protocol fees',
    type: 'string',
    example: '0xc549227a184d7a16ffd7cd9ca923577c84f6e26946de092b30fcc2d9509789f7',
  })
  @IsOptional()
  @IsString()
  readonly blockHash?: string;
}
