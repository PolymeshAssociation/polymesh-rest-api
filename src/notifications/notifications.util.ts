import { createHmac } from 'crypto';
import stringify from 'json-stable-stringify';

import { NotificationPayload } from '~/notifications/types';

/**
 * Compute an HMAC of the payload for legitimacy validation
 */
export function signPayload(payload: NotificationPayload, secret: string): string {
  return createHmac('SHA256', secret).update(stringify(payload)!).digest('base64');
}
