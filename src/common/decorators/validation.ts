/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
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

import { MAX_TICKER_LENGTH } from '~/assets/assets.consts';
import { getTxTags, getTxTagsWithModuleNames } from '~/common/utils';
import { DID_LENGTH } from '~/identities/identities.consts';

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

export function IsBigNumber(
  numericValidations: { min?: number; max?: number } = {},
  validationOptions?: ValidationOptions
) {
  const isDefined = (v: number | undefined): v is number => typeof v !== 'undefined';
  const { min, max } = numericValidations;
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!(value instanceof BigNumber)) {
            return false;
          }
          if (value.isNaN()) {
            return false;
          }
          if (isDefined(min) && value.lt(min)) {
            return false;
          }
          if (isDefined(max) && value.gt(max)) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          let message = `${args.property} must be a number`;
          const hasMin = isDefined(min);
          const hasMax = isDefined(max);
          if (hasMin && hasMax) {
            message += ` that is between ${min} and ${max}`;
          } else if (hasMin) {
            message += ` that is at least ${min}`;
          } else if (hasMax) {
            message += ` that is at most ${max}`;
          }
          return message;
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
