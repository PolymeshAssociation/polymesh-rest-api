/**
 * Different auth strategies available
 */
export enum AuthStrategy {
  // note - order here can affect the evaluation order, it is not arbitrary
  apiKey = 'apiKey',
  open = 'open',
}

export const authStrategyValues = Object.values(AuthStrategy);
