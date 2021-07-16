/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { isEntity, Venue } from '@polymathnetwork/polymesh-sdk/types';
import { Transform } from 'class-transformer';

import { Entity } from '~/common/types';

/**
 * String -> BigNumber
 */
export function ToBigNumber() {
  return applyDecorators(Transform(({ value }: { value: string }) => new BigNumber(value)));
}

/**
 * Venue -> string
 */
export function FromVenue() {
  return applyDecorators(Transform(({ value: { id } }: { value: Venue }) => id.toString()));
}

/**
 * Entity -> POJO
 */
export function FromEntity() {
  return applyDecorators(Transform(({ value }: { value: Entity<unknown> }) => value.toJson()));
}

/**
 * Transforms every Entity in an array to its POJO version
 */
export function FromMaybeEntityArray() {
  return applyDecorators(
    Transform(({ value }: { value: Entity<unknown>[] }) =>
      value.map(val => {
        if (isEntity(val)) {
          return val.toJson();
        }

        return val;
      })
    )
  );
}

/**
 * BigNumber -> string
 */
export function FromBigNumber() {
  return applyDecorators(Transform(({ value }: { value: BigNumber }) => value.toString()));
}
