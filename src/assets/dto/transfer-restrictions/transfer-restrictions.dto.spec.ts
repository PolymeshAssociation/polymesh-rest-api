/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import {
  ClaimType,
  CountryCode,
  InputStatClaim,
  TransferRestrictionType,
} from '@polymeshassociation/polymesh-sdk/types';

import { SetTransferRestrictionsDto } from '~/assets/dto/transfer-restrictions/set-transfer-restrictions.dto';
import { TransferRestrictionClaimCountInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-count-input.dto';
import { TransferRestrictionClaimPercentageInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-percentage-input.dto';
import { TransferRestrictionCountInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-count-input.dto';
import { TransferRestrictionPercentageInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-percentage-input.dto';
import { InvalidCase, ValidCase } from '~/test-utils/types';

type Metatype<T = unknown> = new () => T;

const validDid = '0x0600000000000000000000000000000000000000000000000000000000000000';
const missingTypeError =
  'type must be one of the following values: Count, Percentage, ClaimCount, ClaimPercentage';

const createMetadata = (metatype: Metatype): ArgumentMetadata => ({
  type: 'body',
  metatype,
  data: '',
});

const runValidCases = (pipe: ValidationPipe, metatype: Metatype, cases: ValidCase[]): void => {
  const metadata = createMetadata(metatype);
  test.each(cases)('%s', async (_, input) => {
    await expect(pipe.transform(input, metadata)).resolves.toBeDefined();
  });
};

const runInvalidCases = (pipe: ValidationPipe, metatype: Metatype, cases: InvalidCase[]): void => {
  const metadata = createMetadata(metatype);
  test.each(cases)('%s', async (_, input, expected) => {
    await pipe.transform(input, metadata).catch((err: any) => {
      expect(err.getResponse().message).toEqual(expected);
    });
  });
};

type ValidCaseConfig = [string, Record<string, unknown>, boolean?];
type InvalidCaseConfig = [string, Record<string, unknown>, string[], boolean?];

const withRestrictionType = (
  type: TransferRestrictionType,
  configs: ValidCaseConfig[]
): ValidCase[] =>
  configs.map(([description, body, includeType = true]) => [
    description,
    includeType ? { type, ...body } : body,
  ]);

const withRestrictionTypeInvalid = (
  type: TransferRestrictionType,
  configs: InvalidCaseConfig[]
): InvalidCase[] =>
  configs.map(([description, body, errors, includeType = true]) => [
    description,
    includeType ? { type, ...body } : body,
    errors,
  ]);

const issuerError = (value: unknown): string =>
  `issuer must be a valid DID (received: "${String(value)}")`;

const nestedIssuerError = (path: string, value: unknown): string =>
  `${path} must be a valid DID (received: "${String(value)}")`;

const accreditedClaim = (): InputStatClaim => ({
  type: ClaimType.Accredited,
  accredited: true,
});

const affiliateClaim = (affiliate = false): InputStatClaim => ({
  type: ClaimType.Affiliate,
  affiliate,
});

const jurisdictionClaim = (country: CountryCode = CountryCode.Us): InputStatClaim => ({
  type: ClaimType.Jurisdiction,
  countryCode: country,
});

describe('TransferRestrictionsDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });

  const validationSuites: Array<{
    name: string;
    metatype: Metatype;
    validCases?: ValidCase[];
    invalidCases?: InvalidCase[];
  }> = [
    {
      name: 'TransferRestrictionCountInputDto',
      metatype: TransferRestrictionCountInputDto,
      validCases: withRestrictionType(TransferRestrictionType.Count, [
        ['valid count restriction', { count: '100' }],
        ['count with zero', { count: '0' }],
        ['count with large number', { count: '999999999' }],
      ]),
      invalidCases: withRestrictionTypeInvalid(TransferRestrictionType.Count, [
        ['missing type', { count: '100' }, [missingTypeError], false],
        ['missing count', {}, ['count must be a number']],
        ['invalid count type', { count: 'invalid' }, ['count must be a number']],
        ['negative count', { count: '-1' }, ['count must be a number']],
      ]),
    },
    {
      name: 'TransferRestrictionPercentageInputDto',
      metatype: TransferRestrictionPercentageInputDto,
      validCases: withRestrictionType(TransferRestrictionType.Percentage, [
        ['valid percentage restriction', { percentage: '50' }],
        ['percentage at minimum boundary', { percentage: '0' }],
        ['percentage at maximum boundary', { percentage: '100' }],
      ]),
      invalidCases: withRestrictionTypeInvalid(TransferRestrictionType.Percentage, [
        ['missing type', { percentage: '50' }, [missingTypeError], false],
        ['missing percentage', {}, ['percentage must be a number that is between 0 and 100']],
        [
          'invalid percentage type',
          { percentage: 'invalid' },
          ['percentage must be a number that is between 0 and 100'],
        ],
        [
          'percentage below minimum',
          { percentage: '-1' },
          ['percentage must be a number that is between 0 and 100'],
        ],
        [
          'percentage above maximum',
          { percentage: '101' },
          ['percentage must be a number that is between 0 and 100'],
        ],
      ]),
    },
    {
      name: 'TransferRestrictionClaimCountInputDto',
      metatype: TransferRestrictionClaimCountInputDto,
      validCases: withRestrictionType(TransferRestrictionType.ClaimCount, [
        [
          'valid claim count restriction with accredited claim',
          {
            issuer: validDid,
            claim: accreditedClaim(),
            min: '1',
            max: '10',
          },
        ],
        [
          'valid claim count restriction with affiliate claim',
          {
            issuer: validDid,
            claim: affiliateClaim(false),
            min: '5',
            max: '10',
          },
        ],
        [
          'valid claim count restriction with jurisdiction claim',
          {
            issuer: validDid,
            claim: jurisdictionClaim(),
            min: '2',
            max: '20',
          },
        ],
      ]),
      invalidCases: withRestrictionTypeInvalid(TransferRestrictionType.ClaimCount, [
        [
          'missing type',
          {
            issuer: validDid,
            claim: accreditedClaim(),
            min: '1',
          },
          ['max must be a number', missingTypeError],
          false,
        ],
        [
          'missing issuer',
          { claim: accreditedClaim(), min: '1' },
          ['max must be a number', issuerError(undefined)],
        ],
        [
          'invalid issuer DID',
          { issuer: 'invalid-did', claim: accreditedClaim(), min: '1' },
          ['max must be a number', issuerError('invalid-did')],
        ],
        [
          'issuer DID without 0x prefix',
          {
            issuer: '0600000000000000000000000000000000000000000000000000000000000000',
            claim: accreditedClaim(),
            min: '1',
          },
          [
            'max must be a number',
            issuerError('0600000000000000000000000000000000000000000000000000000000000000'),
          ],
        ],
        [
          'issuer DID too short',
          { issuer: '0x123', claim: accreditedClaim(), min: '1' },
          ['max must be a number', issuerError('0x123')],
        ],
        [
          'issuer DID too long',
          {
            issuer: '0x060000000000000000000000000000000000000000000000000000000000000000',
            claim: accreditedClaim(),
            min: '1',
          },
          [
            'max must be a number',
            issuerError('0x060000000000000000000000000000000000000000000000000000000000000000'),
          ],
        ],
        [
          'issuer DID with non-hex characters',
          {
            issuer: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
            claim: accreditedClaim(),
            min: '1',
          },
          [
            'max must be a number',
            issuerError('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'),
          ],
        ],
        ['missing claim', { issuer: validDid, min: '1' }, ['max must be a number']],
        [
          'invalid claim type',
          {
            issuer: validDid,
            claim: { type: 'InvalidType', accredited: true },
            min: '1',
          },
          [
            'max must be a number',
            'claim.type must be one of the following values: Accredited, Affiliate, BuyLockup, SellLockup, CustomerDueDiligence, KnowYourCustomer, Jurisdiction, Exempted, Blocked, Custom',
          ],
        ],
        [
          'missing accredited field for accredited claim',
          {
            issuer: validDid,
            claim: { type: ClaimType.Accredited },
            min: '1',
          },
          ['max must be a number', 'claim.accredited must be a boolean value'],
        ],
        [
          'missing affiliate field for affiliate claim',
          {
            issuer: validDid,
            claim: { type: ClaimType.Affiliate },
            min: '1',
          },
          ['max must be a number', 'claim.affiliate must be a boolean value'],
        ],
        [
          'missing min',
          { issuer: validDid, claim: accreditedClaim() },
          ['min must be a number', 'max must be a number'],
        ],
        [
          'invalid min type',
          {
            issuer: validDid,
            claim: accreditedClaim(),
            min: 'invalid',
          },
          ['min must be a number', 'max must be a number'],
        ],
        [
          'invalid max type',
          {
            issuer: validDid,
            claim: accreditedClaim(),
            min: '1',
            max: 'invalid',
          },
          ['max must be a number'],
        ],
      ]),
    },
    {
      name: 'TransferRestrictionClaimPercentageInputDto',
      metatype: TransferRestrictionClaimPercentageInputDto,
      validCases: withRestrictionType(TransferRestrictionType.ClaimPercentage, [
        [
          'valid claim percentage restriction with accredited claim',
          {
            issuer: validDid,
            claim: accreditedClaim(),
            min: '10',
            max: '50',
          },
        ],
        [
          'valid claim percentage restriction with jurisdiction claim',
          {
            issuer: validDid,
            claim: jurisdictionClaim(CountryCode.Ca),
            min: '0',
            max: '100',
          },
        ],
      ]),
      invalidCases: withRestrictionTypeInvalid(TransferRestrictionType.ClaimPercentage, [
        [
          'missing type',
          {
            issuer: validDid,
            claim: accreditedClaim(),
            min: '10',
            max: '50',
          },
          [missingTypeError],
          false,
        ],
        [
          'missing issuer',
          { claim: accreditedClaim(), min: '10', max: '50' },
          [issuerError(undefined)],
        ],
        [
          'invalid issuer DID',
          { issuer: 'short-did', claim: accreditedClaim(), min: '10', max: '50' },
          [issuerError('short-did')],
        ],
        [
          'issuer DID without 0x prefix',
          {
            issuer: '0600000000000000000000000000000000000000000000000000000000000000',
            claim: accreditedClaim(),
            min: '10',
            max: '50',
          },
          [issuerError('0600000000000000000000000000000000000000000000000000000000000000')],
        ],
        [
          'issuer DID too short',
          { issuer: '0x123', claim: accreditedClaim(), min: '10', max: '50' },
          [issuerError('0x123')],
        ],
        [
          'issuer DID too long',
          {
            issuer: '0x060000000000000000000000000000000000000000000000000000000000000000',
            claim: accreditedClaim(),
            min: '10',
            max: '50',
          },
          [issuerError('0x060000000000000000000000000000000000000000000000000000000000000000')],
        ],
        [
          'issuer DID with non-hex characters',
          {
            issuer: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
            claim: accreditedClaim(),
            min: '10',
            max: '50',
          },
          [issuerError('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')],
        ],
        ['missing claim', { issuer: validDid, min: '10', max: '50' }, ['claim must be an object']],
        [
          'missing min',
          { issuer: validDid, claim: accreditedClaim(), max: '50' },
          ['min must be a number that is between 0 and 100'],
        ],
        [
          'missing max',
          { issuer: validDid, claim: accreditedClaim(), min: '10' },
          ['max must be a number that is between 0 and 100'],
        ],
        [
          'min below 0',
          { issuer: validDid, claim: accreditedClaim(), min: '-1', max: '50' },
          ['min must be a number that is between 0 and 100'],
        ],
        [
          'min above 100',
          { issuer: validDid, claim: accreditedClaim(), min: '101', max: '50' },
          ['min must be a number that is between 0 and 100'],
        ],
        [
          'max below 0',
          { issuer: validDid, claim: accreditedClaim(), min: '10', max: '-1' },
          ['max must be a number that is between 0 and 100'],
        ],
        [
          'max above 100',
          { issuer: validDid, claim: accreditedClaim(), min: '10', max: '101' },
          ['max must be a number that is between 0 and 100'],
        ],
      ]),
    },
    {
      name: 'SetTransferRestrictionsDto',
      metatype: SetTransferRestrictionsDto,
      validCases: [
        [
          'valid set with count restriction',
          {
            restrictions: [
              {
                type: TransferRestrictionType.Count,
                count: '100',
              },
            ],
          },
        ],
        [
          'valid set with percentage restriction',
          {
            restrictions: [
              {
                type: TransferRestrictionType.Percentage,
                percentage: '50',
              },
            ],
          },
        ],
        [
          'valid set with claim count restriction',
          {
            restrictions: [
              {
                type: TransferRestrictionType.ClaimCount,
                issuer: validDid,
                claim: accreditedClaim(),
                min: '1',
                max: '10',
              },
            ],
          },
        ],
        [
          'valid set with claim percentage restriction',
          {
            restrictions: [
              {
                type: TransferRestrictionType.ClaimPercentage,
                issuer: validDid,
                claim: jurisdictionClaim(),
                min: '10',
                max: '50',
              },
            ],
          },
        ],
        [
          'valid set with multiple restrictions',
          {
            restrictions: [
              {
                type: TransferRestrictionType.Count,
                count: '100',
              },
              {
                type: TransferRestrictionType.Percentage,
                percentage: '25',
              },
              {
                type: TransferRestrictionType.ClaimCount,
                issuer: validDid,
                claim: affiliateClaim(true),
                min: '5',
                max: '10',
              },
            ],
          },
        ],
        ['empty restrictions array', { restrictions: [] }],
      ],
      invalidCases: [
        ['missing restrictions', {}, ['restrictions must be an array']],
        [
          'invalid restriction type',
          {
            restrictions: [
              {
                type: 'InvalidType',
                count: '100',
              },
            ],
          },
          [
            'restrictions.0.type must be one of the following values: Count, Percentage, ClaimCount, ClaimPercentage',
          ],
        ],
        [
          'count restriction missing count',
          {
            restrictions: [
              {
                type: TransferRestrictionType.Count,
              },
            ],
          },
          ['restrictions.0.count must be a number'],
        ],
        [
          'percentage restriction missing percentage',
          {
            restrictions: [
              {
                type: TransferRestrictionType.Percentage,
              },
            ],
          },
          ['restrictions.0.percentage must be a number that is between 0 and 100'],
        ],
        [
          'claim count restriction missing issuer',
          {
            restrictions: [
              {
                type: TransferRestrictionType.ClaimCount,
                claim: accreditedClaim(),
                min: '1',
              },
            ],
          },
          [
            'restrictions.0.max must be a number',
            nestedIssuerError('restrictions.0.issuer', undefined),
          ],
        ],
        [
          'claim percentage restriction missing claim',
          {
            restrictions: [
              {
                type: TransferRestrictionType.ClaimPercentage,
                issuer: validDid,
                min: '10',
                max: '50',
              },
            ],
          },
          ['restrictions.0.claim must be an object'],
        ],
      ],
    },
  ];

  describe.each(validationSuites)('$name', ({ metatype, validCases, invalidCases }) => {
    if (validCases?.length) {
      describe('valid cases', () => runValidCases(pipe, metatype, validCases));
    }

    if (invalidCases?.length) {
      describe('invalid cases', () => runInvalidCases(pipe, metatype, invalidCases));
    }
  });
});
