/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

interface Config {
  nodeUrl: string;
  middleware?: {
    link: string;
    key: string;
  };
}

export default registerAs('polymesh', () => {
  const { POLYMESH_NODE_URL, POLYMESH_MIDDLEWARE_URL, POLYMESH_MIDDLEWARE_API_KEY } = process.env;

  // if (!POLYMESH_NODE_URL) throw new Error('POLYMESH_NODE_URL must be set');

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const config: Config = { nodeUrl: POLYMESH_NODE_URL || 'ws://example.com' };

  if (POLYMESH_MIDDLEWARE_URL && POLYMESH_MIDDLEWARE_API_KEY) {
    config.middleware = { link: POLYMESH_MIDDLEWARE_URL, key: POLYMESH_MIDDLEWARE_API_KEY };
  }

  return config;
});
