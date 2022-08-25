/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { MockDistribution } from '~/corporate-actions/mocks/dividend-distribution.mock';

export class MockDistributionWithDetails {
  distribution = new MockDistribution();
  details = {
    remainingFunds: new BigNumber(2100.1),
    fundsReclaimed: false,
  };
}
