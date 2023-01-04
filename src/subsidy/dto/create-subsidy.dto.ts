/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateSubsidyDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Address of the Account to subsidize',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @IsString()
  readonly beneficiary: string;

  @ApiProperty({
    description: 'Amount of POLYX to be subsidized. This can be increased/decreased later on',
    type: 'string',
    example: '1000',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly allowance: BigNumber;
}
