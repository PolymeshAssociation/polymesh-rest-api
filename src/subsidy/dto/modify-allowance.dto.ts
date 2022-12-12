/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ModifyAllowanceDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'Address of the beneficiary of the Subsidy relationship whose allowance is being modified',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @IsString()
  readonly beneficiary: string;

  @ApiProperty({
    description: 'Amount of POLYX to set the allowance to or increase/decrease the allowance by',
    type: 'string',
    example: '1000',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly allowance: BigNumber;
}
