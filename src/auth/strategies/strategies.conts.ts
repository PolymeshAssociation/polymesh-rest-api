/**
 * Different auth strategies available
 */
export enum AuthStrategy {
  // note - order here is the evaluation order, its not arbitrary
  apiKey = 'apiKey',
  open = 'open',
}

export const authStrategyValues = Object.values(AuthStrategy);

/**
 * A helper to be passed to `.sort`. The order is in which they will be evaluated.
 *
 * For example the the "open" strategy should always be last to allow for testing of other strategies
 */
export const cmpAuthStrategyOrder = (a: AuthStrategy, b: AuthStrategy): number =>
  authStrategyValues.indexOf(a) - authStrategyValues.indexOf(b);
