/* istanbul ignore file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';
import { BigNumber } from 'bignumber.js';
import { Type } from 'class-transformer';

import { createGroupPermissionsModel } from '~/assets/assets.util';
import { GroupPermissionsModel } from '~/assets/models/group-permissions.model';

export class PermissionGroupWithPermissionsModel {
  @ApiPropertyOptional({
    description: 'The ID of the Permission Group',
    type: 'string',
    format: 'bigint',
  })
  readonly id?: BigNumber;

  @ApiPropertyOptional({
    description: 'The type of the Permission Group',
    enum: PermissionGroupType,
  })
  readonly type?: PermissionGroupType;

  @ApiProperty({
    description: 'The permissions of the Custom Permission Group',
    type: () => GroupPermissionsModel,
  })
  @Type(() => GroupPermissionsModel)
  readonly permissions: GroupPermissionsModel;

  constructor({ id, type, permissions }: PermissionGroupWithPermissionsModel) {
    this.permissions = createGroupPermissionsModel(permissions);
    this.id = id;
    this.type = type;
  }
}
