/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { PermissionTypeModel } from '~/accounts/models/permission-type.model';

export class AssetPermissionsModel extends PermissionTypeModel {
  @ApiProperty({
    description: 'List of included/excluded Assets',
    type: 'string',
    isArray: true,
    example: ['TICKER123456'],
  })
  readonly values: string[];

  constructor(model: AssetPermissionsModel) {
    const { type, ...rest } = model;
    super({ type });

    Object.assign(this, rest);
  }
}
