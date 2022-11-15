/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RedeemTokensDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The amount of Asset tokens to be redeemed',
    example: '100',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description:
      'Portfolio number from which the Asset tokens must be redeemed. Use 0 for the Default Portfolio',
    example: '1',
    type: 'string',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly from: BigNumber;
}
