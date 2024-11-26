import { ApiProperty, PickType } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';

import { ToGroupPermissions } from '~/assets/decorators/transformation';
import { IsGroupPermissions } from '~/assets/decorators/validation';
import { CreatePermissionGroupDto } from '~/assets/dto/create-permission-group.dto';
import { ApiPropertyOneOf, IsDid } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class PermissionsDto extends PickType(CreatePermissionGroupDto, [
  'transactions',
  'transactionGroups',
] as const) {}

export class InviteAgentToGroupDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The did of the target identity to invite to the group',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly target: string;

  @ApiPropertyOneOf({
    description: 'Permission group type, ID or Permissions to be assigned to target',
    union: [
      {
        type: 'string',
        enum: Object.values(PermissionGroupType),
        example: PermissionGroupType.Full,
      },
      { type: 'string', example: '1' },
      PermissionsDto,
    ],
  })
  @ToGroupPermissions()
  @IsGroupPermissions()
  readonly permissions: PermissionGroupType | BigNumber | PermissionsDto;
}
