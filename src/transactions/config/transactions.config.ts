/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('transactions', () => {
  const { NOTIFICATIONS_LEGITIMACY_SECRET } = process.env;

  return {
    legitimacySecret: String(NOTIFICATIONS_LEGITIMACY_SECRET),
  };
});
