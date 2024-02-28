/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsConfidentialAssetId } from '~/common/decorators/validation';

export class ConfidentialLegAmountDto {
  @ApiProperty({
    description: 'Then Confidential Asset ID whose amount is being specified',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  @IsConfidentialAssetId()
  readonly confidentialAsset: string;

  @ApiProperty({
    description: 'Amount to be transferred',
    type: 'string',
    example: '1000',
  })
  @ToBigNumber()
  @IsBigNumber({ min: 1 })
  readonly amount: BigNumber;
}
