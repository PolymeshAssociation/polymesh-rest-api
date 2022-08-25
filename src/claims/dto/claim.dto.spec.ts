import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClaimType, CountryCode, ScopeType } from '@polymeshassociation/polymesh-sdk/types';

import { ClaimDto } from '~/claims/dto/claim.dto';
import { InvalidCase, ValidCase } from '~/test-utils/types';

describe('claimsDto', () => {
  const scope = {
    type: ScopeType.Identity,
    value: '0x0600000000000000000000000000000000000000000000000000000000000000',
  };
  const target: ValidationPipe = new ValidationPipe({ transform: true });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: ClaimDto,
    data: '',
  };
  describe('valid Claims', () => {
    const cases: ValidCase[] = [
      [
        'Accredited with `scope`',
        {
          type: ClaimType.Accredited,
          scope,
        },
      ],
      [
        'Affiliate with `scope`',
        {
          type: ClaimType.Affiliate,
          scope,
        },
      ],
      [
        'BuyLockup with `scope`',
        {
          type: ClaimType.BuyLockup,
          scope,
        },
      ],
      [
        'SellLockup with `scope`',
        {
          type: ClaimType.SellLockup,
          scope,
        },
      ],
      [
        'CustomerDueDiligence with `cddId`',
        {
          type: ClaimType.CustomerDueDiligence,
          cddId: '0x60000000000000000000000000000000',
        },
      ],
      [
        'KnowYourCustomer with `scope`',
        {
          type: ClaimType.KnowYourCustomer,
          scope,
        },
      ],
      [
        'Jurisdiction claim with `code` and `scope`',
        {
          type: ClaimType.Jurisdiction,
          scope,
          code: CountryCode.Ca,
        },
      ],
      [
        'Exempted claim with `scope`',
        {
          type: ClaimType.Exempted,
          scope,
        },
      ],
      [
        'Blocked claim with `scope`',
        {
          type: ClaimType.Blocked,
          scope,
        },
      ],
      [
        'InvestorUniqueness claim with `scope`',
        {
          type: ClaimType.InvestorUniqueness,
          scope,
          cddId: '0x60000000000000000000000000000000',
        },
      ],
      [
        'NoData claim with no additional fields',
        {
          type: ClaimType.NoData,
        },
      ],
      [
        'InvestorUniquenessV2 with `cddId`',
        {
          type: ClaimType.InvestorUniquenessV2,
          cddId: '0x60000000000000000000000000000000',
        },
      ],
      [
        'Accredited with valid `issuers`',
        {
          type: ClaimType.Accredited,
          scope,
          issuers: [
            {
              identity: '0x0600000000000000000000000000000000000000000000000000000000000000',
            },
          ],
        },
      ],
    ];
    test.each(cases)('%s', async (_, input) => {
      await target.transform(input, metadata).catch(err => {
        fail(`should not make any errors, received: ${err.getResponse().message}`);
      });
    });
  });

  describe('invalid Claims', () => {
    const cases: InvalidCase[] = [
      [
        'Jurisdiction claim without `code`',
        {
          type: ClaimType.Jurisdiction,
          scope,
        },
        ['code must be a valid enum value'],
      ],
      [
        'Jurisdiction claim with bad `code`',
        {
          type: ClaimType.Jurisdiction,
          scope,
          code: '123',
        },
        ['code must be a valid enum value'],
      ],
      [
        'Accredited without `scope`',
        {
          type: ClaimType.Accredited,
        },
        ['scope must be a non-empty object'],
      ],
      [
        'Affiliate with bad `scope`',
        {
          type: ClaimType.Affiliate,
          scope: { type: 'Wrong', value: 123 },
        },
        ['scope.type must be a valid enum value'],
      ],
      [
        'InvestorUniquenessV2 without `cddId`',
        {
          type: ClaimType.InvestorUniquenessV2,
        },
        [
          'cddId must be a hexadecimal number',
          'cddId must start with "0x"',
          'cddId must be 34 characters long',
        ],
      ],
      [
        'CustomerDueDiligence without `cddId`',
        {
          type: ClaimType.CustomerDueDiligence,
        },
        [
          'cddId must be a hexadecimal number',
          'cddId must start with "0x"',
          'cddId must be 34 characters long',
        ],
      ],
      [
        'Accredited with bad ClaimType in `issuers`',
        {
          type: ClaimType.Accredited,
          scope,
          trustedClaimIssuers: [
            {
              identity: '0x0600000000000000000000000000000000000000000000000000000000000000',
              trustedFor: ['Bad Claims'],
            },
          ],
        },
        ['trustedClaimIssuers.0.each value in trustedFor must be a valid enum value'],
      ],
    ];
    test.each(cases)('%s', async (_, input, expected) => {
      let error;
      await target.transform(input, metadata).catch(err => {
        error = err.getResponse().message;
      });
      expect(error).toEqual(expected);
    });
  });
});
