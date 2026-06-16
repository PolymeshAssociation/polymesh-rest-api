/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class IssueDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The amount of the Asset to issue',
    example: '1000',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;

  @ApiPropertyOptional({
    description:
      'Account to which tokens are issued. Use when not issuing to a portfolio. Only one of account or portfolioId should be provided',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  readonly account?: string;
}
