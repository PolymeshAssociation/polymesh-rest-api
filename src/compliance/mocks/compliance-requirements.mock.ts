import { ClaimType, ConditionType, ScopeType } from '@polymathnetwork/polymesh-sdk/types';

export class MockComplianceRequirements {
  requirements = [
    {
      id: 1,
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
