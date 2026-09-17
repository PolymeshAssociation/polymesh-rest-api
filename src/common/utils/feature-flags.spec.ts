import {
  isAuthManagementEnabled,
  isDeveloperUtilsEnabled,
  isSignerManagementEnabled,
  parseBooleanEnv,
} from '~/common/utils/feature-flags';

describe('feature flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AUTH_STRATEGY;
    delete process.env.DEVELOPER_UTILS;
    delete process.env.AUTH_MANAGEMENT_ENABLED;
    delete process.env.SIGNER_MANAGEMENT_ENABLED;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('parseBooleanEnv', () => {
    it('should return undefined for unset or blank values', () => {
      expect(parseBooleanEnv(undefined)).toBeUndefined();
      expect(parseBooleanEnv('')).toBeUndefined();
      expect(parseBooleanEnv('  ')).toBeUndefined();
    });

    it('should only treat "true" as true', () => {
      expect(parseBooleanEnv('true')).toBe(true);
      expect(parseBooleanEnv(' TRUE ')).toBe(true);
      expect(parseBooleanEnv('false')).toBe(false);
      expect(parseBooleanEnv('FALSE')).toBe(false);
      expect(parseBooleanEnv('1')).toBe(false);
    });
  });

  describe('isDeveloperUtilsEnabled', () => {
    it('should be disabled when unset', () => {
      expect(isDeveloperUtilsEnabled()).toBe(false);
    });

    it('should be disabled when set to "false"', () => {
      process.env.DEVELOPER_UTILS = 'false';
      expect(isDeveloperUtilsEnabled()).toBe(false);
    });

    it('should be enabled when set to "true"', () => {
      process.env.DEVELOPER_UTILS = 'true';
      expect(isDeveloperUtilsEnabled()).toBe(true);
    });
  });

  describe.each([
    ['isAuthManagementEnabled', isAuthManagementEnabled, 'AUTH_MANAGEMENT_ENABLED'],
    ['isSignerManagementEnabled', isSignerManagementEnabled, 'SIGNER_MANAGEMENT_ENABLED'],
  ])('%s', (_, isEnabled, envKey) => {
    it('should be disabled by default when no auth strategy is set', () => {
      expect(isEnabled()).toBe(false);
    });

    it('should be disabled by default when the open strategy is configured', () => {
      process.env.AUTH_STRATEGY = 'open';
      expect(isEnabled()).toBe(false);

      process.env.AUTH_STRATEGY = 'apiKey, open';
      expect(isEnabled()).toBe(false);
    });

    it('should be enabled by default when only the apiKey strategy is configured', () => {
      process.env.AUTH_STRATEGY = 'apiKey';
      expect(isEnabled()).toBe(true);
    });

    it('should respect an explicit value', () => {
      process.env.AUTH_STRATEGY = 'open';
      process.env[envKey] = 'true';
      expect(isEnabled()).toBe(true);

      process.env.AUTH_STRATEGY = 'apiKey';
      process.env[envKey] = 'false';
      expect(isEnabled()).toBe(false);
    });
  });
});
