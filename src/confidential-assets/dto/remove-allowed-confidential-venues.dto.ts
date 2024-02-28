/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RemoveAllowedConfidentialVenuesDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'List of Confidential Venues to be removed from the allowed list of Confidential Venues for handling Confidential Asset transactions',
    isArray: true,
    type: 'string',
    example: ['3'],
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly confidentialVenues: BigNumber[];
}
