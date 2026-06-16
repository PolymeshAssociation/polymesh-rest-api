/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ApproveAllowanceDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Account address authorized to spend the Asset',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @IsString()
  readonly spender: string;

  @ApiProperty({
    description: 'Maximum amount the spender may transfer. Use 0 to revoke the allowance',
    example: '1000',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;
}
