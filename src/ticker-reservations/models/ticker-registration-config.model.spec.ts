/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { instanceToPlain } from 'class-transformer';

import { TickerRegistrationConfigModel } from '~/ticker-reservations/models/ticker-registration-config.model';

describe('TickerRegistrationConfigModel', () => {
  describe('serialization', () => {
    it('should serialize registrationLength as null, not drop the field, when reservations never expire', () => {
      const model = new TickerRegistrationConfigModel({
        maxTickerLength: new BigNumber(12),
        registrationLength: null,
      });

      const plain = instanceToPlain(model);

      expect(plain).toHaveProperty('registrationLength', null);
    });

    it('should serialize registrationLength as a string when set', () => {
      const model = new TickerRegistrationConfigModel({
        maxTickerLength: new BigNumber(12),
        registrationLength: new BigNumber(5184000000),
      });

      const plain = instanceToPlain(model);

      expect(plain.registrationLength).toBe('5184000000');
    });
  });
});
