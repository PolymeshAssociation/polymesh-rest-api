import { SubsidyWithAllowance } from '@polymeshassociation/polymesh-sdk/types';

import { AccountModel } from '~/identities/models/account.model';
import { SubsidyModel } from '~/subsidy/models/subsidy.model';

export function createSubsidyModel(subsidy: SubsidyWithAllowance): SubsidyModel {
  const {
    subsidy: {
      beneficiary: { address: beneficiaryAddress },
      subsidizer: { address: subsidizerAddress },
    },
    allowance,
  } = subsidy;

  return new SubsidyModel({
    beneficiary: new AccountModel({ address: beneficiaryAddress }),
    subsidizer: new AccountModel({ address: subsidizerAddress }),
    allowance,
  });
}
