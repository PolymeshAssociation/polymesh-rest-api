/* istanbul ignore file */
import { PickType } from '@nestjs/swagger';

import { CreatePermissionGroupDto } from '~/permission-groups/dto/create-permission-group.dto';

export class GroupPermissionsDto extends PickType(CreatePermissionGroupDto, [
  'transactions',
  'transactionGroups',
] as const) {}
