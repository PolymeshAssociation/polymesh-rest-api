/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModuleName, TxTag, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { PermissionTypeModel } from '~/accounts/models/permission-type.model';
import { getTxTags, getTxTagsWithModuleNames } from '~/common/utils';

export class TransactionPermissionsModel extends PermissionTypeModel {
  @ApiProperty({
    description:
      'List of included/excluded transactions. A module name (a string without a period separator) represents all the transactions in said module',
    isArray: true,
    enum: getTxTagsWithModuleNames(),
    example: [ModuleName.Asset, TxTags.checkpoint.CreateCheckpoint],
  })
  readonly values: (TxTag | ModuleName)[];

  @ApiPropertyOptional({
    description:
      'Transactions exempted from inclusion or exclusion. For example, if "type" is "Include", "values" contains "asset" and "exceptions" includes "asset.registerTicker", it means that all transactions in the "asset" module are included, EXCEPT for "registerTicker"',
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
