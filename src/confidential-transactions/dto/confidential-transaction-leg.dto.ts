/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

import { IsConfidentialAssetId, IsDid } from '~/common/decorators/validation';

export class ConfidentialTransactionLegDto {
  @ApiProperty({
    description:
      'The confidential Asset IDs for this leg of the transaction. Amounts are specified in the later proof generation steps',
    type: 'string',
    isArray: true,
    example: ['76702175-d8cb-e3a5-5a19-734433351e25'],
  })
  @IsArray()
  @IsConfidentialAssetId({ each: true })
  readonly assets: string[];

  @ApiProperty({
    description:
      'The Confidential Account from which the confidential Assets will be withdrawn from',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @IsString()
  readonly sender: string;

  @ApiProperty({
    description: 'The Confidential Account from which the confidential Assets will be deposited',
    type: 'string',
    example: '0xdeadbeef11111111111111111111111111111111111111111111111111111111',
  })
  @IsString()
  readonly receiver: string;

  @ApiProperty({
    description: 'The confidential Accounts of the auditors of the transaction leg',
    type: 'string',
    isArray: true,
    example: ['0x7e9cf42766e08324c015f183274a9e977706a59a28d64f707e410a03563be77d'],
  })
  @IsArray()
  @IsString({ each: true })
  readonly auditors: string[];

  @ApiProperty({
    description: 'The DID of mediators of the transaction leg',
    type: 'string',
    isArray: true,
    example: ['1'],
  })
  @IsArray()
  @IsDid({ each: true })
  readonly mediators: string[];
}
