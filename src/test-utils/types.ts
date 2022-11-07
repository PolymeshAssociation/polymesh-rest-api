/* istanbul ignore file */

import { Class } from '~/common/types';

export type ValidCase = [string, Record<string, unknown>];

export type InvalidCase = [string, Record<string, unknown>, string[]];

export type ErrorCase = [string, Record<string, unknown>, unknown];

export type ServiceProvider = {
  useValue: unknown;
  provide: Class;
};
