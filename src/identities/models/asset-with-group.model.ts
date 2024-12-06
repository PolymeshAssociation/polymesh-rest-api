/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import {
  Asset,
  CustomPermissionGroup,
  KnownPermissionGroup,
  PermissionGroupType,
} from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators';

export class AssetWithGroupModel {
  @ApiProperty({
    description: 'The Asset ID to which the Identity has permissions',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @FromEntity()
  readonly asset: Asset;

  @ApiProperty({
    description: 'The assigned group details',
    example: {
      type: PermissionGroupType.Full,
      assetId: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
      ticker: 'SOME_TICKER',
    },
  })
  @FromEntity()
  readonly group: KnownPermissionGroup | CustomPermissionGroup;

  constructor(model: AssetWithGroupModel) {
    Object.assign(this, model);
  }
}
