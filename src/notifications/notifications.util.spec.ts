import { TransactionStatus, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { TransactionType } from '~/common/types';
import { EventType } from '~/events/types';
import { signPayload } from '~/notifications/notifications.util';

describe('signPayload', () => {
  it('should create an HMAC of the passed payload, using the passed secret', () => {
    const result = signPayload(
      {
        scope: 'someScope',
        subscriptionId: 1,
        nonce: 1,
        type: EventType.TransactionUpdate,
        payload: {
          status: TransactionStatus.Running,
          transactionHash: '0x01',
          transactionTag: TxTags.asset.RegisterUniqueTicker,
          type: TransactionType.Single,
        },
      },
      'someSecret'
    );

    expect(result).toBe('H967FW2eFJj1clXHP1HBfCjUGKm00EiiPbRVDkN0Gdc=');
  });
});
