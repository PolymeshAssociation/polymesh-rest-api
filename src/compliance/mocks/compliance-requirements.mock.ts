import { createMock } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ClaimType,
  ComplianceRequirements,
  ConditionTarget,
  ConditionType,
  ScopeType,
} from '@polymeshassociation/polymesh-sdk/types';

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
              value: 'Ox6'.padEnd(66, '0'),
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
              value: 'Ox6'.padEnd(66, '0'),
            },
          },
          target: ConditionTarget.Receiver,
          trustedClaimIssuers: [{ identity: { did: 'Ox6'.padEnd(66, '0') } }],
        },
      ],
    },
  ],
  defaultTrustedClaimIssuers: [],
});
