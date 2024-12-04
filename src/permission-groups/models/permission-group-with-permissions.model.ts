/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from 'bignumber.js';
import { Type } from 'class-transformer';

import { createGroupPermissionsModel } from '~/assets/assets.util';
import { GroupPermissionsModel } from '~/permission-groups/models/group-permissions.model';

export class PermissionGroupWithPermissionsModel {
  @ApiProperty({
    description: 'The ID of the Custom Permission Group',
    type: 'string',
    format: 'bigint',
    example: '1',
  })
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The permissions of the Custom Permission Group',
    type: () => GroupPermissionsModel,
  })
  @Type(() => GroupPermissionsModel)
  readonly permissions: GroupPermissionsModel;

  constructor({ id, permissions }: PermissionGroupWithPermissionsModel) {
    this.permissions = createGroupPermissionsModel(permissions);
    this.id = id;
  }
}
