import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import {
  ClaimType,
  ConditionTarget,
  ConditionType,
  ScopeType,
} from '@polymathnetwork/polymesh-sdk/types';

import { ClaimDto } from '~/claims/dto/claim.dto';
import { ConditionDto } from '~/compliance/dto/condition.dto';
import { InvalidCase, ValidCase } from '~/test-utils/types';

const address = '0x0600000000000000000000000000000000000000000000000000000000000000';
const validClaim: ClaimDto = {
  type: ClaimType.Accredited,
  scope: {
    type: ScopeType.Identity,
    value: address,
  },
};
const invalidClaim: ClaimDto = {
  type: ClaimType.Accredited,
};

describe('conditionDto', () => {
  const target: ValidationPipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: ConditionDto,
    data: '',
  };
  describe('valid ConditionDtos', () => {
    const cases: ValidCase[] = [
      [
        'IsPresent',
        { type: ConditionType.IsPresent, target: ConditionTarget.Both, claim: validClaim },
      ],
      [
        'IsNone',
        { type: ConditionType.IsAbsent, target: ConditionTarget.Receiver, claim: validClaim },
      ],
      [
        'IsAnyOf',
        { type: ConditionType.IsAnyOf, target: ConditionTarget.Receiver, claims: [validClaim] },
      ],
      [
        'IsNoneOf',
        { type: ConditionType.IsNoneOf, target: ConditionTarget.Sender, claims: [validClaim] },
      ],
      [
        'IsIdentity',
        {
          type: ConditionType.IsIdentity,
          target: ConditionTarget.Sender,
          identity: address,
        },
      ],
      [
        'IsPresent with trustedClaimIssuers',
        {
          type: ConditionType.IsPresent,
          target: ConditionTarget.Both,
          claim: validClaim,
          trustedClaimIssuers: [
            {
              identity: address,
            },
          ],
        },
      ],
    ];
    test.each(cases)('%s', async (_, input) => {
      await target.transform(input, metadata).catch(err => {
        fail(`should not get any errors. Received: ${err.getResponse().message}`);
      });
    });
  });

  describe('invalid ConditionDtos', () => {
    const cases: InvalidCase[] = [
      [
        'IsPresent without `target`',
        { type: ConditionType.IsPresent, claim: validClaim },
        ['target must be a valid enum value'],
      ],
      [
        'IsPresent without `claim`',
        { type: ConditionType.IsPresent, target: ConditionTarget.Both },
        ['claim must be a non-empty object'],
      ],
      [
        'IsAnyOf without `claims`',
        { type: ConditionType.IsAnyOf, target: ConditionTarget.Receiver },
        ['claims should not be empty'],
      ],
      [
        'IsNoneOf with an invalid claim in `claims`',
        { type: ConditionType.IsNoneOf, target: ConditionTarget.Both, claims: [invalidClaim] },
        ['claims.0.scope must be a non-empty object'],
      ],
      [
        'IsIdentity without `identity`',
        { type: ConditionType.IsIdentity, target: ConditionTarget.Receiver },
        [
          'DID must be a hexadecimal number',
          'DID must start with "0x"',
          'DID must be 66 characters long',
        ],
      ],
      [
        'IsPresent with invalid `identity` in `trustedClaimIssuers`',
        {
          type: ConditionType.IsPresent,
          target: ConditionTarget.Both,
          claim: validClaim,
          trustedClaimIssuers: [
            {
              identity: 123,
            },
          ],
        },
        [
          'trustedClaimIssuers.0.DID must be a hexadecimal number',
          'trustedClaimIssuers.0.DID must start with "0x"',
          'trustedClaimIssuers.0.DID must be 66 characters long',
        ],
      ],
    ];

    test.each(cases)('%s', async (_, input, expected) => {
      await target.transform(input, metadata).catch(err => {
        expect(err.getResponse().message).toEqual(expected);
      });
    });
  });
});
