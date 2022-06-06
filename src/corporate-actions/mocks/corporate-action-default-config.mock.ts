/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';

import { MockIdentity } from '~/test-utils/mocks';

export class MockCorporateActionDefaultConfig {
  defaultTaxWithholding = new BigNumber(25);
  taxWithholdings = [
    {
      identity: new MockIdentity(),
      percentage: new BigNumber(10),
    },
  ];

  targets = {
    identities: [new MockIdentity()],
    treatment: TargetTreatment.Exclude,
  };
}
