/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockPortfolio } from '~/test-utils/mocks';

export class MockDistribution extends MockCorporateActionDefaultConfig {
  origin = new MockPortfolio();
  currency = 'TOKEN2';
  perShare = new BigNumber('0.1');
  maxAmount = new BigNumber('2100.1');
  expiryDate = null;
  paymentDate = new Date('10/14/1987');
  token = { ticker: 'TOKEN4' };
  id = new BigNumber('1');
  declarationDate = new Date('10/14/1987');
  description = 'Mock Description';

  public pay = jest.fn();
}
