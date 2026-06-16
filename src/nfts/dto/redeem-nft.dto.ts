/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RedeemNftDto extends TransactionBaseDto {
  @ApiPropertyOptional({
    description:
      'The portfolio number from which the Nft must be redeemed from. Use 0 for the default portfolio',
    example: '1',
    type: 'string',
  })
  @ValidateIf(({ fromAccount }) => !fromAccount)
  @IsBigNumber()
  @ToBigNumber()
  readonly from?: BigNumber;

  @ApiPropertyOptional({
    description: 'Account from which the NFT must be redeemed (alternative to from portfolio)',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @ValidateIf(({ from }) => from === undefined)
  readonly fromAccount?: string;
}
