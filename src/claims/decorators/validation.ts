/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { applyDecorators } from '@nestjs/common';
import { ScopeType } from '@polymeshassociation/polymesh-sdk/types';
import {
  IsHexadecimal,
  isHexadecimal,
  Length,
  length,
  Matches,
  matches,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isString } from 'lodash';

import { isAssetId, isTicker } from '~/common/decorators';
import { CDD_ID_LENGTH, DID_LENGTH } from '~/identities/identities.consts';

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
            case ScopeType.Asset:
              return isString(value) && (isAssetId(value) || isTicker(value));
            case ScopeType.Ticker:
              return isString(value) && isTicker(value);
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
            case ScopeType.Asset:
              return 'value must be a valid Asset ID (either in hex or UUID format) or a valid ticker (all uppercase and no longer than 12 characters)';
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
