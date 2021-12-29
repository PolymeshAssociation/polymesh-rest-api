/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

import { getTxTags, getTxTagsWithModuleNames } from '~/identities/identities.util';

export function IsPermissionsLike() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPermissionsLike',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: unknown) {
          if (typeof value === 'object' && value) {
            return !('transactions' in value && 'transactionGroups' in value);
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} can have either 'transactions' or 'transactionGroups'`;
        },
      },
    });
  };
}

// TODO @prashantasdeveloper Reduce the below code from two decorators if possible - IsTxTag and IsTxTagOrModuleName
export function IsTxTag(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTxTag',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && getTxTags().includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          if (validationOptions?.each) {
            return `${args.property} must have all valid enum values`;
          }
          return `${args.property} must be a valid enum value`;
        },
      },
    });
  };
}

export function IsTxTagOrModuleName(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTxTagOrModuleName',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && getTxTagsWithModuleNames().includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          if (validationOptions?.each) {
            return `${args.property} must have all valid enum values from "ModuleName" or "TxTags"`;
          }
          return `${args.property} must be a valid enum value from "ModuleName" or "TxTags"`;
        },
      },
    });
  };
}
