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
  return applyDecorators(Transform(({ value }: { value: string }) => new BigNumber(value)));
}

/**
 * Entity -> POJO
 */
export function FromEntity() {
  return applyDecorators(Transform(({ value }: { value: Entity<unknown> }) => value?.toHuman()));
}

/**
 * Transforms every Entity in an array to its POJO version
 */
export function FromMaybeEntityArray() {
  return applyDecorators(
    Transform(({ value }: { value: unknown[] }) =>
      value.map(val => {
        if (isEntity(val)) {
          return val.toHuman();
        }

        return val;
      })
    )
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
  return applyDecorators(Transform(({ value }: { value: BigNumber }) => value?.toString()));
}
