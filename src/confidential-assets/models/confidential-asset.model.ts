/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class ConfidentialAssetModel {
  @ApiProperty({
    description: 'The ID of the confidential Asset',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  readonly id: string;

  constructor(model: ConfidentialAssetModel) {
    Object.assign(this, model);
  }
}
