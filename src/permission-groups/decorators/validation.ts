/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';
import { registerDecorator, validate as validateClass, ValidationArguments } from 'class-validator';

import { GroupPermissionsDto } from '~/permission-groups/dto/group-permissions.dto';

export function IsGroupPermissions() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPermissions',
      target: object.constructor,
      propertyName,
      validator: {
        async validate(value: unknown) {
          if (
            typeof value === 'string' &&
            Object.values(PermissionGroupType).includes(value as PermissionGroupType)
          ) {
            return true;
          }
          if (value instanceof GroupPermissionsDto) {
            return (await validateClass(value)).length === 0;
          }
          if (!(value instanceof BigNumber)) {
            return false;
          }
          if (value.isNaN()) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid 'Date' or object of type 'CorporateActionCheckpointDto'`;
        },
      },
    });
  };
}
