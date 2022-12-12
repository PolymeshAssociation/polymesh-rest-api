import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AccountModel } from '~/identities/models/account.model';
import { createSubsidyModel } from '~/subsidy/subsidy.util';
import { createMockSubsidy } from '~/test-utils/mocks';

describe('createSubsidyModel', () => {
  it('should transform SubsidyWithAllowance to SubsidyModel', () => {
    const subsidyWithAllowance = {
      subsidy: createMockSubsidy(),
      allowance: new BigNumber(10),
    };

    const result = createSubsidyModel(subsidyWithAllowance);

    expect(result).toEqual({
      beneficiary: new AccountModel({ address: 'beneficiary' }),
      subsidizer: new AccountModel({ address: 'subsidizer' }),
      allowance: new BigNumber(10),
    });
  });
});
