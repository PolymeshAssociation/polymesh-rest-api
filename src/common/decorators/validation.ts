/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { KnownTokenType, ScopeType } from '@polymathnetwork/polymesh-sdk/types';
import {
  IsHexadecimal,
  isHexadecimal,
  IsUppercase,
  isUppercase,
  Length,
  length,
  Matches,
  matches,
  MaxLength,
  maxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { get, isString } from 'lodash';

import { MAX_TICKER_LENGTH } from '~/assets/assets.consts';
import { CDD_ID_LENGTH, DID_LENGTH } from '~/identities/identities.consts';
import { getTxTags, getTxTagsWithModuleNames } from '~/identities/identities.util';

export function IsDid(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsHexadecimal({
      ...validationOptions,
      message: 'DID must be a hexadecimal number',
    }),
    Matches(/^0x.+/, {
      ...validationOptions,
      message: 'DID must start with "0x"',
    }),
    Length(DID_LENGTH, undefined, {
      ...validationOptions,
      message: `DID must be ${DID_LENGTH} characters long`,
    })
  );
}

export function IsTicker(validationOptions?: ValidationOptions) {
  return applyDecorators(
    MaxLength(MAX_TICKER_LENGTH, validationOptions),
    IsUppercase(validationOptions)
  );
}

export function IsCddId() {
  return applyDecorators(
    IsHexadecimal({
      message: 'cddId must be a hexadecimal number',
    }),
    Matches(/^0x.+/, {
      message: 'cddId must start with "0x"',
    }),
    Length(CDD_ID_LENGTH, undefined, {
      message: `cddId must be ${CDD_ID_LENGTH} characters long`,
    })
  );
}

export function IsBigNumber(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBigNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return value instanceof BigNumber && !value.isNaN();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a number`;
        },
      },
    });
  };
}

export function IsAssetType() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAssetType',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: unknown) {
          if (typeof value === 'string') {
            return Object.values(KnownTokenType).includes(value as KnownTokenType);
          } else {
            return (
              typeof value === 'object' &&
              typeof get(value, 'custom') === 'string' &&
              Object.keys(value as Record<string, unknown>).length === 1
            );
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a Known type or object of type "{ custom: string }"`;
        },
      },
    });
  };
}

/**
 * Applies validation to a scope value field based on a scope type.
 *   `property` specifies which field to use as the scope type (probably 'type').
 */
export function IsValidScopeValue(property: string, validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidScopeValue',
      target: object.constructor,
      options: validationOptions,
      constraints: [property],
      propertyName,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [scopeTypeField] = args.constraints;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const scopeType = (args.object as any)[scopeTypeField];
          switch (scopeType) {
            case ScopeType.Ticker:
              return maxLength(value, MAX_TICKER_LENGTH) && isUppercase(value);
            case ScopeType.Identity:
              return (
                isHexadecimal(value) &&
                isString(value) &&
                matches(value, /^0x.+/) &&
                length(value, DID_LENGTH, undefined)
              );
            case ScopeType.Custom:
              return false;
            default:
              return true;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const [scopeTypeField] = args.constraints;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const scopeType = (args.object as any)[scopeTypeField];
          switch (scopeType) {
            case ScopeType.Ticker:
              return `value must be all uppercase and no longer than 12 characters for type: ${scopeType}`;
            case ScopeType.Identity:
              return `value must be a hex string ${DID_LENGTH} characters long and prefixed with 0x`;
            case ScopeType.Custom:
              return 'ScopeType.Custom not currently supported';
          }
          return `value must be a valid scope value for ${property}: ${scopeType}`;
        },
      },
    });
  };
}

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
