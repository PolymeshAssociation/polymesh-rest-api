/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { GroupPermissions, PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';
import { BigNumber } from 'bignumber.js';
import { Type } from 'class-transformer';

import { createGroupPermissionsModel } from '~/assets/assets.util';
import { FromBigNumber } from '~/common/decorators';
import { GroupPermissionsModel } from '~/permission-groups/models/group-permissions.model';

export type PermissionGroupWithPermissionsModelParams = {
  id?: BigNumber;
  type?: PermissionGroupType;
  permissions: GroupPermissions;
};

export class PermissionGroupWithPermissionsModel {
  @ApiProperty({
    description: 'The ID of the Custom Permission Group (present for custom groups)',
    type: 'string',
    format: 'bigint',
    example: '1',
    required: false,
    nullable: true,
  })
  @FromBigNumber()
  readonly id?: BigNumber;

  @ApiProperty({
    description: 'The type of the Known Permission Group',
    enum: PermissionGroupType,
    example: PermissionGroupType.Full,
    required: false,
    nullable: true,
  })
  readonly type?: PermissionGroupType;

  @ApiProperty({
    description: 'The permissions associated with the Permission Group',
    type: () => GroupPermissionsModel,
  })
  @Type(() => GroupPermissionsModel)
  readonly permissions: GroupPermissionsModel;

  constructor({ id, type, permissions }: PermissionGroupWithPermissionsModelParams) {
    this.permissions = createGroupPermissionsModel(permissions);
    this.id = id;
    this.type = type;
  }
}
