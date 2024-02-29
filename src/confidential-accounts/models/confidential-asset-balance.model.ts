/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class ConfidentialAssetBalanceModel {
  @ApiProperty({
    description: 'The ID of the Confidential Asset',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  readonly confidentialAsset: string;

  @ApiProperty({
    description: 'Encrypted balance of the Confidential Asset',
    type: 'string',
    example: '0xbalance',
  })
  readonly balance: string;

  constructor(model: ConfidentialAssetBalanceModel) {
    Object.assign(this, model);
  }
}
