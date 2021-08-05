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

import { MAX_TICKER_LENGTH } from '~/assets/assets.consts';
import { DID_LENGTH } from '~/identities/identities.consts';

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

interface customAssetType {
  custom: string;
}
export function IsAssetType() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAssetType',
      target: object.constructor,
      propertyName: propertyName,
      validator: {
        validate(value: string | customAssetType) {
          if (typeof value === 'string') {
            console.log(Object.values(KnownTokenType));
            return Object.values(KnownTokenType).includes(value as KnownTokenType);
          } else if (typeof value === 'object') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Object.keys(value).length === 1 && typeof (value.custom as any) === 'string';
          } else {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a Known type or object with key "custom"`;
        },
      },
    });
  };
}
