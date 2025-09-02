/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class ClaimCountAffiliateValueDto {
  @ApiProperty({ description: 'Affiliate investor count', type: 'string', example: '5' })
  @ToBigNumber()
  @IsBigNumber()
  readonly affiliate: BigNumber;

  @ApiProperty({ description: 'Non-affiliate investor count', type: 'string', example: '95' })
  @ToBigNumber()
  @IsBigNumber()
  readonly nonAffiliate: BigNumber;
}
