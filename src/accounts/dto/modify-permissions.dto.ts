/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { PermissionedAccountDto } from '~/accounts/dto/permissioned-account.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ModifyPermissionsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'List of secondary Accounts containing address and modified permissions',
    type: PermissionedAccountDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => PermissionedAccountDto)
  readonly secondaryAccounts: PermissionedAccountDto[];
}
