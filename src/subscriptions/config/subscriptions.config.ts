/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('subscriptions', () => {
  const {
    SUBSCRIPTIONS_TTL,
    SUBSCRIPTIONS_MAX_HANDSHAKE_TRIES,
    SUBSCRIPTIONS_HANDSHAKE_RETRY_INTERVAL,
    WEBHOOK_ALLOW_PRIVATE_ADDRESSES,
  } = process.env;

  return {
    ttl: Number(SUBSCRIPTIONS_TTL),
    maxTries: Number(SUBSCRIPTIONS_MAX_HANDSHAKE_TRIES),
    retryInterval: Number(SUBSCRIPTIONS_HANDSHAKE_RETRY_INTERVAL),
    allowPrivateAddresses: WEBHOOK_ALLOW_PRIVATE_ADDRESSES === 'true',
  };
});
