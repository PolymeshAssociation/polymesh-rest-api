/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { PermissionType } from '@polymathnetwork/polymesh-sdk/types';

export class PermissionTypeModel {
  @ApiProperty({
    description: 'Indicates whether the permissions are inclusive or exclusive',
    type: 'string',
    enum: PermissionType,
    example: PermissionType.Include,
  })
  readonly type: PermissionType;

  constructor(model: PermissionTypeModel) {
    Object.assign(this, model);
  }
}
