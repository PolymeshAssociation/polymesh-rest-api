/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PermissionsModel } from '~/accounts/models/permissions.model';
import { AccountModel } from '~/identities/models/account.model';

export class PermissionedAccountModel {
  @ApiProperty({
    description: 'Account details',
    type: AccountModel,
  })
  @Type(() => AccountModel)
  readonly account: AccountModel;

  @ApiProperty({
    description: 'Permissions present for this Permissioned Account',
    type: PermissionsModel,
  })
  @Type(() => PermissionsModel)
  readonly permissions: PermissionsModel;

  constructor(model: PermissionedAccountModel) {
    Object.assign(this, model);
  }
}
