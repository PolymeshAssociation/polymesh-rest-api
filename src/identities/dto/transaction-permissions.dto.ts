/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { ModuleName } from '@polymathnetwork/polymesh-sdk/polkadot';
import { TransactionPermissions, TxTag, TxTags } from '@polymathnetwork/polymesh-sdk/types';
import { ArrayNotEmpty, IsArray, IsOptional } from 'class-validator';

import { IsTxTag, IsTxTagOrModuleName } from '~/common/decorators/validation';
import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';
import { getTxTags, getTxTagsWithModuleNames } from '~/identities/identities.util';

export class TransactionPermissionsDto extends PermissionTypeDto {
  @ApiProperty({
    description: 'Transactions to be included/excluded',
    isArray: true,
    enum: getTxTagsWithModuleNames(),
    example: [ModuleName.Asset, TxTags.checkpoint.CreateCheckpoint],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsTxTagOrModuleName({ each: true })
  readonly values: (TxTag | ModuleName)[];

  @ApiProperty({
    description:
      'Transactions to be exempted from inclusion/exclusion. For example, if you wish to exclude the entire `asset` module except for `asset.createAsset`, you would pass `ModuleName.Asset` as part of the `values` array, and `TxTags.asset.CreateAsset` as part of the `exceptions` array',
    isArray: true,
    enum: getTxTags(),
    example: [TxTags.asset.RegisterTicker],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsTxTag({ each: true })
  @IsOptional()
  readonly exceptions?: TxTag[];

  public toTransactionPermissions(): TransactionPermissions | null {
    const { values, type, exceptions } = this;

    if (type) {
      return {
        values,
        type,
        exceptions,
      };
    }

    return null;
  }

  constructor(dto: Omit<TransactionPermissionsDto, 'toSectionPermissions'>) {
    super();
    Object.assign(this, dto);
  }
}
