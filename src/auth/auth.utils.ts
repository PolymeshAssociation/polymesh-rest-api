import {
  AuthStrategy,
  authStrategyValues,
  cmpAuthStrategyOrder,
} from '~/auth/strategies/strategies.conts';

/**
 * transforms a raw auth strategy config into valid strategy values
 *
 * @throws if given invalid values
 */
export const parseAuthStrategyConfig = (rawStrategyConfig: string): AuthStrategy[] => {
  const givenStrategies = rawStrategyConfig.split(',').map(s => s.trim());

  const filteredStrategies = givenStrategies.filter(isStrategyKey);

  if (filteredStrategies.length !== givenStrategies.length) {
    throw new Error(
      `Auth config error! "${givenStrategies}" contains an unrecognized option. Valid values are: "${authStrategyValues}"`
    );
  }

  return filteredStrategies.sort(cmpAuthStrategyOrder);
};

export const parseApiKeysConfig = (rawApiKeyConfig: string): string[] => {
  return rawApiKeyConfig.split(',').map(rawKey => rawKey.trim());
};

const isStrategyKey = (key: string): key is AuthStrategy => {
  return Object.values(AuthStrategy).includes(key as AuthStrategy);
};
