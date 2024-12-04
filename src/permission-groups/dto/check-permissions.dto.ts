/* istanbul ignore file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TxTag, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { ArrayNotEmpty, IsArray, IsOptional } from 'class-validator';

import { IsDid, IsTxTag } from '~/common/decorators';
import { getTxTags } from '~/common/utils';

export class CheckPermissionsDto {
  @ApiProperty({
    description: 'The DID of the target identity for which to check permissions',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly target: string;

  @ApiPropertyOptional({
    description:
      'The transactions for which to check permissions. If null, checks for full permissions',
    isArray: true,
    enum: getTxTags(),
    example: [TxTags.asset.Issue],
    nullable: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsTxTag({ each: true })
  @IsOptional()
  readonly transactions?: TxTag[];
}
