import { parseAuthStrategyConfig } from '~/auth/auth.utils';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';

/**
 * Feature flags that decide which controllers get registered. These are read from `process.env` while the
 * module graph is being built, so they must only be called after `ConfigModule.forRoot` has run
 *
 * @note `ConfigModule` writes validated values back to `process.env` as strings, so a `Joi.bool()` default of
 *   `false` ends up as the string `"false"`, which is truthy. Always compare against `"true"` explicitly
 */
export const parseBooleanEnv = (value: string | undefined): boolean | undefined => {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  return value.trim().toLowerCase() === 'true';
};

const isOpenAuthConfigured = (): boolean => {
  const { AUTH_STRATEGY } = process.env;

  if (!AUTH_STRATEGY) {
    return true;
  }

  return parseAuthStrategyConfig(AUTH_STRATEGY).includes(AuthStrategy.Open);
};

/**
 * Whether the `/developer-testing` endpoints should be exposed. Disabled unless `DEVELOPER_UTILS=true`
 */
export const isDeveloperUtilsEnabled = (): boolean =>
  parseBooleanEnv(process.env.DEVELOPER_UTILS) ?? false;

/**
 * Whether REST API users and API keys can be managed over HTTP (`/users/create`, `/auth/api-key/*`)
 *
 * Defaults to disabled when the `open` auth strategy is configured, since any caller could otherwise use them
 */
export const isAuthManagementEnabled = (): boolean =>
  parseBooleanEnv(process.env.AUTH_MANAGEMENT_ENABLED) ?? !isOpenAuthConfigured();

/**
 * Whether signing keys can be added over HTTP (`POST /signer`)
 *
 * Defaults to disabled when the `open` auth strategy is configured, since any caller could otherwise use them
 */
export const isSignerManagementEnabled = (): boolean =>
  parseBooleanEnv(process.env.SIGNER_MANAGEMENT_ENABLED) ?? !isOpenAuthConfigured();
