/* istanbul ignore file */

import { registerAs } from '@nestjs/config';
import { Keyring } from '@polymathnetwork/polymesh-sdk';

export default registerAs('polymesh', () => {
  const {
    POLYMESH_NODE_URL,
    POLYMESH_MIDDLEWARE_URL,
    POLYMESH_MIDDLEWARE_API_KEY,
    VAULT_TRANSIT_URL,
  } = process.env;

  let keyring: Keyring | undefined;
  if (VAULT_TRANSIT_URL) {
    keyring = new Keyring();
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const config = { nodeUrl: POLYMESH_NODE_URL!, keyring };

  if (!POLYMESH_MIDDLEWARE_URL || !POLYMESH_MIDDLEWARE_API_KEY) {
    return config;
  }

  return {
    ...config,
    middleware: { link: POLYMESH_MIDDLEWARE_URL, key: POLYMESH_MIDDLEWARE_API_KEY },
  };
});
