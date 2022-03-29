/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import {
  ModuleName,
  TransactionPermissions,
  TxTag,
  TxTags,
} from '@polymathnetwork/polymesh-sdk/types';
import { ArrayNotEmpty, IsArray, IsOptional } from 'class-validator';

import { IsTxTag, IsTxTagOrModuleName } from '~/common/decorators/validation';
import { getTxTags, getTxTagsWithModuleNames } from '~/common/utils';
import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';

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

  public toPermissions(): TransactionPermissions | null {
    const { values, type, exceptions } = this;

    return {
      values,
      type,
      exceptions,
    };
  }

  constructor(dto: Omit<TransactionPermissionsDto, 'toPermissions'>) {
    super();
    Object.assign(this, dto);
  }
}
