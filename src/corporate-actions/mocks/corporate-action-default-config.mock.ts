/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TargetTreatment } from '@polymeshassociation/polymesh-sdk/types';

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
