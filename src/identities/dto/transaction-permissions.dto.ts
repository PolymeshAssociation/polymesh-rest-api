/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TxTag } from '@polymathnetwork/polymesh-sdk/types';

import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';

export class TransactionPermissionsDto extends PermissionTypeDto {
  readonly exceptions?: TxTag[];

  @ApiProperty({
    isArray: true,
    type: 'string',
  })
  readonly values: TxTag[];
}
