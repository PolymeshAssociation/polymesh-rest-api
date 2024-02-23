/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsConfidentialAssetId } from '~/common/decorators/validation';

export class ConfidentialLegAmountDto {
  @ApiProperty({
    description: 'Then Confidential Asset ID whose amount is being specified',
    type: 'string',
    example: '1',
  })
  @IsConfidentialAssetId()
  readonly confidentialAsset: string;

  @ApiProperty({
    description: 'Affirming party',
    type: 'string',
    example: '1000',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;
}
