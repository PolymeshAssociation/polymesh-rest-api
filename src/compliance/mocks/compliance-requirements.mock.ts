import { createMock } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ClaimType,
  ComplianceRequirements,
  ConditionTarget,
  ConditionType,
  ScopeType,
} from '@polymeshassociation/polymesh-sdk/types';

import { testValues } from '~/test-utils/consts';
export class MockComplianceRequirements {
  requirements = [
    {
      id: new BigNumber(1),
      conditions: [
        {
          type: ConditionType.IsPresent,
          claim: {
            type: ClaimType.Accredited,
            scope: {
              type: ScopeType.Identity,
              value: did,
            },
          },
          target: 'Receiver',
          trustedClaimIssuers: [],
        },
      ],
    },
  ];

  defaultTrustedClaimIssuers = [];
}

const { did } = testValues;

export const mockComplianceRequirements = createMock<ComplianceRequirements>({
  requirements: [
    {
      id: new BigNumber(1),
      conditions: [
        {
          type: ConditionType.IsPresent,
          claim: {
            type: ClaimType.Accredited,
            scope: {
              type: ScopeType.Identity,
              value: did,
            },
          },
          target: ConditionTarget.Receiver,
          trustedClaimIssuers: [{ identity: { did } }],
        },
      ],
    },
  ],
  defaultTrustedClaimIssuers: [],
});
