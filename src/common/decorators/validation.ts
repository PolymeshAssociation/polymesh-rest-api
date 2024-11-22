/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { isHexUuid, isUuid } from '@polymeshassociation/polymesh-sdk/utils';
import {
  IsHexadecimal,
  IsUppercase,
  isUppercase,
  Length,
  Matches,
  MaxLength,
  maxLength,
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { ASSET_ID_LENGTH, MAX_TICKER_LENGTH } from '~/assets/assets.consts';
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

export const isAssetId = (id: string): boolean => {
  return isHexUuid(id) || isUuid(id);
};

export const isTicker = (ticker: string): boolean => {
  return maxLength(ticker, MAX_TICKER_LENGTH) && isUppercase(ticker);
};

export function IsAsset(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAsset',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return isAssetId(value) || isTicker(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be either a Ticker (${MAX_TICKER_LENGTH} characters uppercase string) or an Asset ID (${ASSET_ID_LENGTH} characters long hex string)`;
        },
      },
    });
  };
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
      name: 'isBigNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value instanceof Array) {
            return value.every(val => val instanceof BigNumber);
          }
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

@ValidatorConstraint({ async: false })
class IsNotSiblingOfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    if (value !== undefined && value !== null) {
      return this.getFailedConstraints(args).length === 0;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${
      args.property
    } cannot exist alongside the following defined properties: ${this.getFailedConstraints(
      args
    ).join(', ')}`;
  }

  getFailedConstraints(args: ValidationArguments) {
    return args.constraints.filter(prop => {
      const value = args.object[prop as keyof typeof args.object];
      return value !== undefined && value !== null;
    });
  }
}

function IsNotSiblingOf(props: string[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: props,
      validator: IsNotSiblingOfConstraint,
    });
  };
}

function incompatibleSiblingsNotPresent(incompatibleSiblings: string[]) {
  return function (o: object, v: unknown) {
    return Boolean(
      v !== undefined || // Validate if prop has value
        incompatibleSiblings.every(prop => o[prop as keyof typeof o] === undefined) // Validate if all incompatible siblings are not defined
    );
  };
}

/**
 * Validates that a property cannot be used together with certain other properties.
 * If any of the incompatible sibling properties are defined, this property must be undefined.
 *
 * @param incompatibleSiblings - Array of property names that cannot be used together with the decorated property
 * @param validationOptions - Optional validation options to customize the validation behavior and error messages
 *
 * @example
 * class Example {
 *   @IncompatibleWith(['bar'])
 *   foo: string;
 *
 *   bar: string;
 * }
 */
export function IncompatibleWith(
  incompatibleSiblings: string[],
  validationOptions?: ValidationOptions
) {
  const notSibling = IsNotSiblingOf(incompatibleSiblings, {
    message: `Property cannot be used together with: ${incompatibleSiblings.join(', ')}`,
    ...validationOptions,
  });
  const validateIf = ValidateIf(incompatibleSiblingsNotPresent(incompatibleSiblings));
  return function (target: object, key: string) {
    notSibling(target, key);
    validateIf(target, key);
  };
}
