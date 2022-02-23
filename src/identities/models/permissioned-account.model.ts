/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Permissions } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromEntityObject } from '~/common/decorators/transformation';
import { AccountModel } from '~/identities/models/account.model';

export class PermissionedAccountModel {
  @ApiProperty({
    description: 'Account details',
    type: () => AccountModel,
  })
  @Type(() => AccountModel)
  readonly account: AccountModel;

  @ApiProperty({
    description: 'Permissions present with this Secondary Account',
  })
  @FromEntityObject()
  readonly permissions: Permissions;

  constructor(model: PermissionedAccountModel) {
    Object.assign(this, model);
  }
}
