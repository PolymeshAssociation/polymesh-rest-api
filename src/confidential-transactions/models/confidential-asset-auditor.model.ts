/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { ConfidentialAssetModel } from '~/confidential-assets/models/confidential-asset.model';

export class ConfidentialAssetAuditorModel {
  @ApiProperty({
    description: 'Confidential Asset ID being transferred in the leg',
    type: ConfidentialAssetModel,
  })
  @Type(() => ConfidentialAssetModel)
  readonly asset: ConfidentialAssetModel;

  @ApiProperty({
    description: 'List of auditor confidential Accounts for the `asset`',
    type: ConfidentialAccountModel,
    isArray: true,
  })
  @Type(() => ConfidentialAccountModel)
  readonly auditors: ConfidentialAccountModel[];

  constructor(model: ConfidentialAssetAuditorModel) {
    Object.assign(this, model);
  }
}
