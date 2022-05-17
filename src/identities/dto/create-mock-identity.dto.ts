/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsNumber } from '~/common/decorators/validation';

export class CreateMockIdentityDto {
  @ApiProperty({
    description: 'Account address to create an Identity for',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @IsString()
  readonly address: string;

  @ApiProperty({
    description: 'Starting POLYX balance to initialize the Account with',
    example: 100000,
  })
  @IsNumber({ atLeast: 0 })
  @ToBigNumber()
  readonly initialPolyx: BigNumber;
}
