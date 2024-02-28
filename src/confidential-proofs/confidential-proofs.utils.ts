/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { camelCase, mapKeys, mapValues, snakeCase } from 'lodash';

export function serializeObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(serializeObject);
  }

  if (obj instanceof BigNumber && !obj.isNaN()) {
    return obj.toNumber();
  }

  if (obj && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snakeCasedObject = mapKeys(obj as any, (_, key) => snakeCase(key));
    return mapValues(snakeCasedObject, val => serializeObject(val));
  }
  return obj;
}

export function deserializeObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(deserializeObject);
  }

  if (typeof obj === 'number') {
    return new BigNumber(obj);
  }

  if (obj && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snakeCasedObject = mapKeys(obj as any, (_, key) => camelCase(key));
    return mapValues(snakeCasedObject, val => deserializeObject(val));
  }
  return obj;
}
