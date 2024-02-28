/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class AddAllowedConfidentialVenuesDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'List of confidential Venues to be allowed to create confidential Transactions for a specific Confidential Asset',
    isArray: true,
    type: 'string',
    example: ['1', '2'],
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly confidentialVenues: BigNumber[];
}
