import { parseApiKeysConfig, parseAuthStrategyConfig } from '~/auth/auth.utils';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';

describe('parseAuthStrategyConfig', () => {
  it('should handle a single option', () => {
    const result = parseAuthStrategyConfig('apiKey');
    expect(result).toEqual([AuthStrategy.apiKey]);
  });
  it('should split up valid options', () => {
    const result = parseAuthStrategyConfig('apiKey,open');
    expect(result).toEqual([AuthStrategy.apiKey, AuthStrategy.open]);
  });

  it('should order auth strategies', () => {
    const result = parseAuthStrategyConfig('open, apiKey');
    expect(result).toEqual([AuthStrategy.apiKey, AuthStrategy.open]);
  });

  it('should throw if an invalid option is given', () => {
    return expect(() =>
      parseAuthStrategyConfig('open,apiKey,NOT_A_STRATEGY')
    ).toThrowErrorMatchingSnapshot();
  });
});

describe('parseApiKeysConfig', () => {
  it('should split and trim on commas', () => {
    const result = parseApiKeysConfig('abc,def, ghi ');
    expect(result).toEqual(['abc', 'def', 'ghi']);
  });
});
