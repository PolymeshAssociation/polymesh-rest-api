/**
 * Different auth strategies available
 */
export enum AuthStrategy {
  // note - order here can affect the evaluation order, it is not arbitrary
  ApiKey = 'apiKey',
  Open = 'open',
}

export const authStrategyValues = Object.values(AuthStrategy);
