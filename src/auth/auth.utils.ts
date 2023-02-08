import { AuthGuard, IAuthGuard } from '@nestjs/passport';

import { AuthStrategy, authStrategyValues } from '~/auth/strategies/strategies.consts';

/**
 *  Creates an AuthGuard using the configured strategies
 */
export const createAuthGuard = (rawStrategy: string): IAuthGuard => {
  const strategies = parseAuthStrategyConfig(rawStrategy);
  return new (class extends AuthGuard(strategies) {})();
};

/**
 * transforms a raw auth strategy config into valid strategy values
 *
 * @throws if given invalid values
 */
export const parseAuthStrategyConfig = (rawStrategyConfig: string): AuthStrategy[] => {
  const givenStrategies = rawStrategyConfig.split(',').map(strategy => strategy.trim());

  const filteredStrategies = givenStrategies.filter(isStrategyKey);

  if (filteredStrategies.length !== givenStrategies.length) {
    throw new Error(
      `Auth config error! "${givenStrategies}" contains an unrecognized option. Valid values are: "${authStrategyValues}"`
    );
  }

  return filteredStrategies.sort(cmpAuthStrategyOrder);
};

export const parseApiKeysConfig = (rawApiKeyConfig: string): string[] => {
  if (rawApiKeyConfig.trim() === '') {
    return [];
  }

  return rawApiKeyConfig.split(',').map(rawKey => rawKey.trim());
};

const isStrategyKey = (key: string): key is AuthStrategy => {
  return authStrategyValues.includes(key as AuthStrategy);
};

/**
 * A helper to be passed to `.sort`. The order is in which they will be evaluated.
 *
 * For example the the "open" strategy should always be last to allow for testing of other strategies
 */
const cmpAuthStrategyOrder = (a: AuthStrategy, b: AuthStrategy): number =>
  authStrategyValues.indexOf(a) - authStrategyValues.indexOf(b);
