/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsOptional, IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
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
      'Amount of POLYX to be transferred. Note that amount to be transferred should not be greater than free balance',
    type: 'string',
    example: '123',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly amount: BigNumber;

  @ApiPropertyOptional({
    description: 'Identifier string to help differentiate transfers',
    type: 'string',
    example: 'Sample transfer',
  })
  @IsOptional()
  @IsString()
  readonly memo?: string;
}
