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
import { get } from 'lodash';

import { MAX_TICKER_LENGTH } from '~/assets/assets.consts';
import { CDD_ID_LENGTH, DID_LENGTH } from '~/identities/identities.consts';

export function IsDid() {
  return applyDecorators(
    IsHexadecimal({
      message: 'DID must be a hexadecimal number',
    }),
    Matches(/^0x.+/, {
      message: 'DID must start with "0x"',
    }),
    Length(DID_LENGTH, undefined, {
      message: `DID must be ${DID_LENGTH} characters long`,
    })
  );
}

export function IsTicker() {
  return applyDecorators(MaxLength(MAX_TICKER_LENGTH), IsUppercase());
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
                matches(value as string, /^0x.+/) &&
                length(value, DID_LENGTH, undefined)
              );
            default:
              return true; // if the user gave a bad enum value then we can't meaningfully validate the value
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
              return `value must be hex string for type: ${scopeType}`;
          }
          return `value must be a valid scope value for ${property}: ${scopeType}`;
        },
      },
    });
  };
}
