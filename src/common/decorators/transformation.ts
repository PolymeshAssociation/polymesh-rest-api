/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { isEntity } from '@polymeshassociation/polymesh-sdk/utils';
import { Transform } from 'class-transformer';
import { mapValues } from 'lodash';

import { Entity } from '~/common/types';

/**
 * String -> BigNumber
 */
export function ToBigNumber() {
  return applyDecorators(
    Transform(({ value }: { value: string | Array<string> }) => {
      if (value instanceof Array) {
        return value.map(val => new BigNumber(val));
      } else {
        return new BigNumber(value);
      }
    })
  );
}

/**
 * Entity -> POJO
 */
export function FromEntity() {
  return applyDecorators(
    Transform(({ value }: { value: Entity<unknown> }) => {
      if (typeof value.toHuman === 'function') {
        return value.toHuman();
      }

      return undefined;
    })
  );
}

/**
 * Transform all SDK Entities in the object/array into their serialized versions,
 *   or serialize the value if it is an SDK Entity in
 */
export function FromEntityObject() {
  return applyDecorators(Transform(({ value }: { value: unknown }) => toHumanObject(value)));
}

function toHumanObject(obj: unknown): unknown {
  if (isEntity(obj)) {
    return obj.toHuman();
  }

  if (Array.isArray(obj)) {
    return obj.map(toHumanObject);
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof BigNumber && !obj.isNaN()) {
    return obj.toString();
  }

  if (obj && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapValues(obj as any, val => toHumanObject(val));
  }
  return obj;
}

/**
 * BigNumber -> string
 */
export function FromBigNumber() {
  return applyDecorators(
    Transform(({ value }: { value: BigNumber | BigNumber[] }) => {
      if (value instanceof Array) {
        return value.map(val => val.toString());
      } else {
        return value?.toString();
      }
    })
  );
}
