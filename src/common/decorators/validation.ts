/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
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

import { DID_LENGTH } from '~/identities/identities.consts';
import { MAX_TICKER_LENGTH } from '~/tokens/tokens.consts';

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
