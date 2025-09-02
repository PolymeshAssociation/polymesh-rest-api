/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class ClaimCountAccreditedValueDto {
  @ApiProperty({ description: 'Accredited investor count', type: 'string', example: '10' })
  @ToBigNumber()
  @IsBigNumber()
  readonly accredited: BigNumber;

  @ApiProperty({ description: 'Non-accredited investor count', type: 'string', example: '90' })
  @ToBigNumber()
  @IsBigNumber()
  readonly nonAccredited: BigNumber;
}
