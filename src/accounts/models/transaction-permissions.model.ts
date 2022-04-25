/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModuleName, TxTag, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { PermissionTypeModel } from '~/accounts/models/permission-type.model';
import { getTxTags, getTxTagsWithModuleNames } from '~/common/utils';

export class TransactionPermissionsModel extends PermissionTypeModel {
  @ApiProperty({
    description: 'Transactions to be included or excluded',
    isArray: true,
    enum: getTxTagsWithModuleNames(),
    example: [ModuleName.Asset, TxTags.checkpoint.CreateCheckpoint],
  })
  readonly values: (TxTag | ModuleName)[];

  @ApiPropertyOptional({
    description: 'Transactions exempted from inclusion or exclusion',
    isArray: true,
    enum: getTxTags(),
    example: [TxTags.asset.RegisterTicker],
  })
  readonly exceptions?: TxTag[];

  constructor(model: TransactionPermissionsModel) {
    const { type, ...rest } = model;
    super({ type });

    Object.assign(this, rest);
  }
}
