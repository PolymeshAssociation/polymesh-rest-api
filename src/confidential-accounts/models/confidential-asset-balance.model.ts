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
    example:
      '0x289ebc384a263acd5820e03988dd17a3cd49ee57d572f4131e116b6bf4c70a1594447bb5d1e2d9cc62f083d8552dd90ec09b23a519b361e458d7fe1e48882261',
  })
  readonly balance: string;

  constructor(model: ConfidentialAssetBalanceModel) {
    Object.assign(this, model);
  }
}
