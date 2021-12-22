/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { registerDecorator, validate as validateClass, ValidationArguments } from 'class-validator';

import { CorporateActionCheckpointDto } from '~/corporate-actions/dto/corporate-action-checkpoint.dto';

export function IsCaCheckpoint() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCaCheckpoint',
      target: object.constructor,
      propertyName,
      validator: {
        async validate(value: unknown) {
          if (value instanceof Date) {
            return !isNaN(new Date(value).getTime());
          }
          if (value instanceof CorporateActionCheckpointDto) {
            return (await validateClass(value)).length === 0;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid 'Date' or object of type 'CorporateActionCheckpointDto'`;
        },
      },
    });
  };
}
