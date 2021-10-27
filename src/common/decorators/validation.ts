/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { KnownTokenType } from '@polymathnetwork/polymesh-sdk/types';
import {
  IsHexadecimal,
  IsUppercase,
  Length,
  Matches,
  MaxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { get } from 'lodash';

import { MAX_TICKER_LENGTH } from '~/assets/assets.consts';
import { DID_LENGTH } from '~/identities/identities.consts';
import { getTxTags, getTxTagsWithModuleNames } from '~/identities/identities.util';

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

export function IsTicker(validationOptions?: ValidationOptions) {
  return applyDecorators(
    MaxLength(MAX_TICKER_LENGTH, validationOptions),
    IsUppercase(validationOptions)
  );
}

export function IsBigNumber(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBigNumber',
      target: object.constructor,
      propertyName: propertyName,
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
      propertyName: propertyName,
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

export function IsTxTag(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTxTag',
      target: object.constructor,
      propertyName: propertyName,
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
      propertyName: propertyName,
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
