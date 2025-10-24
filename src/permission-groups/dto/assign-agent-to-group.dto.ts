/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';

import { ApiPropertyOneOf, IsDid } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ToGroupPermissions } from '~/permission-groups/decorators/transformation';
import { IsGroupPermissions } from '~/permission-groups/decorators/validation';
import { GroupPermissionsDto } from '~/permission-groups/dto/group-permissions.dto';

export class AssignAgentToGroupDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'The DID of the existing agent whose permission group assignment should be changed',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly target: string;

  @ApiPropertyOneOf({
    description:
      'Permission group type, ID or permissions that should replace the current assignment for the agent',
    union: [
      {
        type: 'string',
        enum: Object.values(PermissionGroupType),
        example: PermissionGroupType.Full,
      },
      { type: 'string', example: '1' },
      GroupPermissionsDto,
    ],
  })
  @ToGroupPermissions()
  @IsGroupPermissions()
  readonly permissions: PermissionGroupType | BigNumber | GroupPermissionsDto;
}
