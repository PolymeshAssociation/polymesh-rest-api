/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { MAX_MEMO_LENGTH } from '~/accounts/accounts.consts';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class TransferPolyxDto extends SignerDto {
  @ApiProperty({
    description: 'Account that will receive the POLYX',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @IsString()
  readonly to: string;

  @ApiProperty({
    description:
      "Amount of POLYX to be transferred. Note that amount to be transferred should not be greater than the origin Account's free balance",
    type: 'string',
    example: '123',
  })
  @IsNumber()
  @ToBigNumber()
  readonly amount: BigNumber;

  @ApiPropertyOptional({
    description: 'A note to help differentiate transfers',
    type: 'string',
    example: 'Sample transfer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_MEMO_LENGTH)
  readonly memo?: string;
}
