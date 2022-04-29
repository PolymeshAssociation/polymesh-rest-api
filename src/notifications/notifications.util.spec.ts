import { TransactionStatus, TxTags } from '@polymathnetwork/polymesh-sdk/types';

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
          transactionTag: TxTags.asset.RegisterTicker,
          type: TransactionType.Single,
        },
      },
      'someSecret'
    );

    expect(result).toBe('iYFr08wYKxLP8eiFT7tOfkvid+0f3FT3h7wH81ELNsQ=');
  });
});
