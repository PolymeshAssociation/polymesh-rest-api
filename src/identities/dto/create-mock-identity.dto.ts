/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class CreateMockIdentityDto {
  @ApiProperty({
    description: 'Account address to create an Identity for',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @IsString()
  readonly address: string;
  // TODO should get address validator

  @ApiProperty({
    description: 'Starting POLYX balance to initialize the Account with. Unit in micro POLYX',
    example: 100000000000,
  })
  @IsBigNumber()
  @ToBigNumber()
  initialPolyx: BigNumber;
  // TODO this should probably be converted to POLY token instead of µPOLYX
  // 6 decimal places of precision and positive number
}
