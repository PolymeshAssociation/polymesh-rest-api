/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity, Venue } from '@polymathnetwork/polymesh-sdk/types';
import { Transform } from 'class-transformer';

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
 * Identity -> string
 */
export function FromIdentity() {
  return applyDecorators(Transform(({ value: { did } }: { value: Identity }) => did));
}

/**
 * BigNumber -> string
 */
export function FromBigNumber() {
  return applyDecorators(Transform(({ value }: { value: BigNumber }) => value.toString()));
}
