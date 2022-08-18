import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType, ConditionType, ScopeType } from '@polymeshassociation/polymesh-sdk/types';

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
