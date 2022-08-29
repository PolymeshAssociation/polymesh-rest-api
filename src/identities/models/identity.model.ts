/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PermissionedAccountModel } from '~/accounts/models/permissioned-account.model';

export class IdentityModel {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    description: 'Unique Identity identifier (DID: Decentralized IDentity)',
  })
  readonly did: string;

  @ApiProperty({
    description: 'Primary Account of the Identity',
    type: () => PermissionedAccountModel,
  })
  @Type(() => PermissionedAccountModel)
  readonly primaryAccount: PermissionedAccountModel;

  @ApiProperty({
    description: 'Secondary Accounts of the Identity (Up to the first 200)',
    type: () => PermissionedAccountModel,
    isArray: true,
  })
  @Type(() => PermissionedAccountModel)
  readonly secondaryAccounts: PermissionedAccountModel[];

  @ApiProperty({
    type: 'boolean',
    description: 'Indicator to know if Secondary Accounts are frozen or not',
    example: false,
  })
  readonly secondaryAccountsFrozen: boolean;

  constructor(model: IdentityModel) {
    Object.assign(this, model);
  }
}
