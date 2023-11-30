/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RedeemNftDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'The portfolio number from which the Nft must be redeemed from. Use 0 for the default portfolio',
    example: '1',
    type: 'string',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly from: BigNumber;
}
