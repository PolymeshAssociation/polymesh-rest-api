/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsHexadecimal, IsObject, ValidateNested } from 'class-validator';

import { PayloadDto } from '~/transactions/dto/payload.dto';
import { RawPayloadDto } from '~/transactions/dto/raw-payload.dto';

export class TransactionDto {
  @ApiProperty({
    type: 'string',
    description:
      'The signature for the transaction (note: the first byte indicates key type `00` for ed25519 `01` for sr25519)',
    example:
      '0x012016ceb0854616be2feed01212aa42815a92d2ae34feae3a0924058563ca81042933ebc25303e7d79026f734d867da4de106d22c0fb22a0a8303a9b0be49bd8f',
  })
  @IsHexadecimal()
  readonly signature: string;

  @ApiProperty({
    type: 'string',
    description: 'The method of the transaction',
    example: '0x80041a075449434b455200000000000000ca9a3b00000000000000000000000000',
  })
  @IsHexadecimal()
  readonly method: `0x${string}`;

  @ApiProperty({
    type: PayloadDto,
    description: 'The transaction payload',
  })
  @Type(() => PayloadDto)
  @ValidateNested()
  readonly payload: PayloadDto;

  @ApiProperty({
    type: RawPayloadDto,
    description: 'The raw transaction payload',
  })
  @Type(() => RawPayloadDto)
  @ValidateNested()
  readonly rawPayload: RawPayloadDto;

  @ApiProperty({
    description: 'Additional information associated with the transaction',
  })
  @IsObject()
  readonly metadata: Record<string, string>;
}
