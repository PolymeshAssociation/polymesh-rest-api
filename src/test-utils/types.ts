/* istanbul ignore file */

export type ValidCase = [string, Record<string, unknown>];

export type InvalidCase = [string, Record<string, unknown>, string[]];

export type ErrorCase = [string, Record<string, unknown>, unknown];
