/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { registerDecorator, ValidationArguments } from 'class-validator';

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
