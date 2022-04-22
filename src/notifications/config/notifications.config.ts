/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('notifications', () => {
  const { NOTIFICATIONS_MAX_TRIES, NOTIFICATIONS_RETRY_INTERVAL } = process.env;

  return {
    maxTries: Number(NOTIFICATIONS_MAX_TRIES),
    retryInterval: Number(NOTIFICATIONS_RETRY_INTERVAL),
  };
});
