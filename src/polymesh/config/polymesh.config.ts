/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

interface MiddlewareConfig {
  link: string;
  key: string;
}

interface Config {
  nodeUrl: string;
  middleware?: MiddlewareConfig;
  middlewareV2?: MiddlewareConfig;
}

export default registerAs('polymesh', () => {
  const {
    POLYMESH_NODE_URL,
    POLYMESH_MIDDLEWARE_URL,
    POLYMESH_MIDDLEWARE_API_KEY,
    POLYMESH_MIDDLEWARE_V2_URL,
  } = process.env;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const config: Config = { nodeUrl: POLYMESH_NODE_URL || '' };

  if (POLYMESH_MIDDLEWARE_URL && POLYMESH_MIDDLEWARE_API_KEY) {
    config.middleware = { link: POLYMESH_MIDDLEWARE_URL, key: POLYMESH_MIDDLEWARE_API_KEY };
  }

  if (POLYMESH_MIDDLEWARE_V2_URL) {
    config.middlewareV2 = { link: POLYMESH_MIDDLEWARE_V2_URL, key: '' };
  }

  return config;
});
