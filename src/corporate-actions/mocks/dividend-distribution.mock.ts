/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockPortfolio } from '~/test-utils/mocks';

export class MockDistribution extends MockCorporateActionDefaultConfig {
  origin = new MockPortfolio();
  currency = 'FAKE_CURRENCY';
  perShare = new BigNumber('0.1');
  maxAmount = new BigNumber('2100.1');
  expiryDate = null;
  paymentDate = new Date('10/14/1987');
  asset = { ticker: 'FAKE_TICKER' };
  id = new BigNumber(1);
  declarationDate = new Date('10/14/1987');
  description = 'Mock Description';

  public pay = jest.fn();
  public claim = jest.fn();
  public linkDocuments = jest.fn();
  public reclaimFunds = jest.fn();
  public modifyCheckpoint = jest.fn();
}
