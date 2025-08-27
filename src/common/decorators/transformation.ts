/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType, TrustedFor } from '@polymeshassociation/polymesh-sdk/types';
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

/**
 * Transform input data into TrustedFor format
 * Handles both simple claim types and custom claim objects
 *
 * @param options - Configuration options for the transformation
 * @param options.each - If true, applies transformation to each item in arrays
 */
export function ToTrustedFor(options: { each?: boolean } = {}) {
  const { each = true } = options;

  return applyDecorators(
    Transform(({ value }: { value: unknown }) => {
      if (value === null || value === undefined) {
        return value;
      }

      if (Array.isArray(value) && each) {
        return value.map(transformToTrustedFor);
      }

      if (Array.isArray(value) && !each) {
        // If each is false, treat the array as a single value
        return transformToTrustedFor(value);
      }

      return transformToTrustedFor(value);
    })
  );
}

function transformToTrustedFor(value: unknown): TrustedFor {
  // If it's already in the correct format, return as is
  if (typeof value === 'string' && Object.values(ClaimType).includes(value as ClaimType)) {
    return value as TrustedFor;
  }

  // If it's an object with type and customClaimTypeId, ensure it's properly formatted
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    if (obj.type === ClaimType.Custom && obj.customClaimTypeId !== undefined) {
      // Ensure customClaimTypeId is a BigNumber
      if (obj.customClaimTypeId instanceof BigNumber) {
        return {
          type: ClaimType.Custom,
          customClaimTypeId: obj.customClaimTypeId,
        };
      }

      // Convert string to BigNumber if needed
      if (typeof obj.customClaimTypeId === 'string' || typeof obj.customClaimTypeId === 'number') {
        return {
          type: ClaimType.Custom,
          customClaimTypeId: new BigNumber(obj.customClaimTypeId),
        };
      }
    }
  }

  // If it's a simple string that represents a claim type, return as is
  if (typeof value === 'string') {
    return value as TrustedFor;
  }

  return value as TrustedFor;
}
