/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString, ValidateIf } from 'class-validator';

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

  @ApiPropertyOptional({
    description:
      'Portfolio number from which the Asset tokens must be redeemed. Use 0 for the Default Portfolio',
    example: '1',
    type: 'string',
  })
  @ValidateIf(({ fromAccount }) => !fromAccount)
  @IsBigNumber()
  @ToBigNumber()
  readonly from?: BigNumber;

  @ApiPropertyOptional({
    description:
      'Account from which the Asset tokens must be redeemed (alternative to from portfolio)',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @ValidateIf(({ from }) => from === undefined)
  @IsString()
  readonly fromAccount?: string;
}
