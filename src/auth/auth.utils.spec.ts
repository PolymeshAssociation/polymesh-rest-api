import { createAuthGuard, parseApiKeysConfig } from '~/auth/auth.utils';

describe('createAuthGuard', () => {
  it('should handle a single option', async () => {
    const guard = createAuthGuard('apiKey');
    expect(guard).toBeDefined();
  });

  it('should handle multiple valid options', () => {
    const guard = createAuthGuard('apiKey,open');
    expect(guard).toBeDefined();
  });

  it('should throw if an invalid option is given', () => {
    return expect(() =>
      createAuthGuard('open,apiKey,NOT_A_STRATEGY')
    ).toThrowErrorMatchingSnapshot();
  });
});

describe('parseApiKeysConfig', () => {
  it('should split and trim on commas', () => {
    const result = parseApiKeysConfig('abc,def, ghi ');
    expect(result).toEqual(['abc', 'def', 'ghi']);
  });
});
