/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';
import { plainToClass, Transform } from 'class-transformer';

import { GroupPermissionsDto } from '~/permission-groups/dto/group-permissions.dto';

/**
 * String | { type: string; id: string; } -> PermissionsDto | BigNumber | PermissionGroupType
 */
export function ToGroupPermissions() {
  return applyDecorators(
    Transform(({ value }: { value: PermissionGroupType | BigNumber | GroupPermissionsDto }) => {
      if (typeof value === 'string' && Object.values(PermissionGroupType).includes(value)) {
        return value as PermissionGroupType;
      } else if (typeof value === 'string') {
        return new BigNumber(value);
      } else {
        return plainToClass(GroupPermissionsDto, value);
      }
    })
  );
}
