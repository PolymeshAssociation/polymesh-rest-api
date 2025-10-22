/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClaimType, CountryCode, StatType } from '@polymeshassociation/polymesh-sdk/types';

import { SetStatsDto } from '~/assets/dto/transfer-restrictions/set-stats.dto';
import { AddClaimCountAccreditedStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-accredited-stat.dto';
import { AddClaimCountJurisdictionStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto';
import { InvalidCase, ValidCase } from '~/test-utils/types';

type Stat = Record<string, any>;

const validDid = '0x0600000000000000000000000000000000000000000000000000000000000000';

const statsDidError = (value: unknown): string =>
  `stats.0.issuer must be a valid DID (received: "${String(value)}")`;

const statsPayload = (...statItems: Stat[]): Record<string, unknown> => ({
  stats: statItems,
});

const make = (factory: () => Stat, mutate?: (draft: Stat) => void): Stat => {
  const draft = factory();
  if (mutate) {
    mutate(draft);
  }
  return draft;
};

const withStat = (factory: () => Stat, mutate?: (draft: Stat) => void): Record<string, unknown> =>
  statsPayload(make(factory, mutate));

const countStat = (count = '100'): Stat => ({
  type: StatType.Count,
  count,
});

const percentageStat = (): Stat => ({
  type: StatType.Balance,
});

const scopedCountStat = (claimType: ClaimType): Stat => {
  switch (claimType) {
    case ClaimType.Accredited:
      return {
        type: StatType.ScopedCount,
        issuer: validDid,
        claimType,
        value: {
          accredited: '50',
          nonAccredited: '30',
        },
      };
    case ClaimType.Affiliate:
      return {
        type: StatType.ScopedCount,
        issuer: validDid,
        claimType,
        value: {
          affiliate: '5',
          nonAffiliate: '95',
        },
      };
    case ClaimType.Jurisdiction:
      return {
        type: StatType.ScopedCount,
        issuer: validDid,
        claimType,
        value: [
          {
            countryCode: CountryCode.Us,
            count: '25',
          },
        ],
      };
    default:
      return {
        type: StatType.ScopedCount,
        issuer: validDid,
        claimType,
      };
  }
};

const scopedBalanceStat = (claimType: ClaimType = ClaimType.Accredited): Stat => ({
  type: StatType.ScopedBalance,
  issuer: validDid,
  claimType,
});

const scopedCount = (
  claimType: ClaimType,
  mutate?: (draft: Stat) => void
): Record<string, unknown> => withStat(() => scopedCountStat(claimType), mutate);

const scopedBalance = (
  claimType: ClaimType,
  mutate?: (draft: Stat) => void
): Record<string, unknown> => withStat(() => scopedBalanceStat(claimType), mutate);

const runValidCases = (
  pipe: ValidationPipe,
  metadata: ArgumentMetadata,
  cases: ValidCase[]
): void => {
  test.each(cases)('%s', async (_, input) => {
    await expect(pipe.transform(input, metadata)).resolves.toBeDefined();
  });
};

const runInvalidCases = (
  pipe: ValidationPipe,
  metadata: ArgumentMetadata,
  cases: InvalidCase[]
): void => {
  test.each(cases)('%s', async (_, input, expected) => {
    await pipe.transform(input, metadata).catch((err: any) => {
      expect(err.getResponse().message).toEqual(expected);
    });
  });
};

describe('SetStatsDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: SetStatsDto,
    data: '',
  };

  const validCases: ValidCase[] = [
    ['valid count stat', withStat(() => countStat())],
    ['valid percentage stat', withStat(() => percentageStat())],
    ['valid claim count accredited stat', scopedCount(ClaimType.Accredited)],
    ['valid claim percentage stat', scopedBalance(ClaimType.Jurisdiction)],
    [
      'valid multiple stats',
      statsPayload(countStat(), percentageStat(), scopedCountStat(ClaimType.Accredited)),
    ],
    ['valid with deprecated signer', { ...withStat(() => countStat()), signer: 'alice' }],
    ['valid claim count jurisdiction stat', scopedCount(ClaimType.Jurisdiction)],
  ];

  const scopedCountIssuerVariants: Array<[string, string]> = [
    ['claim count stat with invalid issuer DID', 'invalid-did'],
    [
      'claim count stat with issuer DID without 0x prefix',
      '0600000000000000000000000000000000000000000000000000000000000000',
    ],
    ['claim count stat with issuer DID too short', '0x123'],
    [
      'claim count stat with issuer DID too long',
      '0x060000000000000000000000000000000000000000000000000000000000000000',
    ],
    [
      'claim count stat with issuer DID with non-hex characters',
      '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
  ];

  const scopedBalanceIssuerVariants: Array<[string, string]> = [
    ['claim percentage stat with invalid issuer DID', 'short-did'],
    [
      'claim percentage stat with issuer DID without 0x prefix',
      '0600000000000000000000000000000000000000000000000000000000000000',
    ],
    ['claim percentage stat with issuer DID too short', '0x123'],
    [
      'claim percentage stat with issuer DID too long',
      '0x060000000000000000000000000000000000000000000000000000000000000000',
    ],
    [
      'claim percentage stat with issuer DID with non-hex characters',
      '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
  ];

  const invalidCases: InvalidCase[] = [
    ['missing stats', {}, ['stats must be an array']],
    [
      'stats not an array',
      {
        stats: 'not-an-array',
      },
      ['each value in nested property stats must be either object or array'],
    ],
    [
      'empty stats array',
      {
        stats: [],
      },
      ['stats should not be empty'],
    ],
    [
      'invalid stat type',
      statsPayload({
        type: 'InvalidType',
        count: '100',
      }),
      [
        'stats.0.type must be one of the following values: Count, Balance, ScopedCount, ScopedBalance',
      ],
    ],
    [
      'count stat missing count field',
      withStat(
        () => countStat(),
        stat => delete stat.count
      ),
      ['stats.0.count must be a number'],
    ],
    [
      'count stat with invalid count',
      withStat(() => countStat('not-a-number')),
      ['stats.0.count must be a number'],
    ],
    [
      'claim count stat missing issuer',
      scopedCount(ClaimType.Accredited, stat => delete stat.issuer),
      [statsDidError(undefined)],
    ],
    ...scopedCountIssuerVariants.map(
      ([description, issuer]) =>
        [
          description,
          scopedCount(ClaimType.Accredited, stat => {
            stat.issuer = issuer;
          }),
          [statsDidError(issuer)],
        ] as InvalidCase
    ),
    [
      'claim count stat missing claimType',
      scopedCount(ClaimType.Accredited, stat => delete stat.claimType),
      [
        'stats.0.claimType must be one of the following values: Accredited, Affiliate, BuyLockup, SellLockup, CustomerDueDiligence, KnowYourCustomer, Jurisdiction, Exempted, Blocked, Custom',
      ],
    ],
    [
      'claim count stat with invalid claimType',
      scopedCount(ClaimType.Accredited, stat => {
        stat.claimType = 'InvalidClaimType';
      }),
      [
        'stats.0.claimType must be one of the following values: Accredited, Affiliate, BuyLockup, SellLockup, CustomerDueDiligence, KnowYourCustomer, Jurisdiction, Exempted, Blocked, Custom',
      ],
    ],
    [
      'claim count accredited stat missing value',
      scopedCount(ClaimType.Accredited, stat => delete stat.value),
      ['stats.0.value must be an object'],
    ],
    [
      'claim count accredited stat with invalid accredited value',
      scopedCount(ClaimType.Accredited, stat => {
        stat.value.accredited = 'not-a-number';
      }),
      ['stats.0.value.accredited must be a number'],
    ],
    [
      'claim count accredited stat with invalid nonAccredited value',
      scopedCount(ClaimType.Accredited, stat => {
        stat.value.nonAccredited = 'not-a-number';
      }),
      ['stats.0.value.nonAccredited must be a number'],
    ],
    [
      'claim count affiliate stat with invalid affiliate value',
      scopedCount(ClaimType.Affiliate, stat => {
        stat.value.affiliate = 'not-a-number';
      }),
      ['stats.0.value.affiliate must be a number'],
    ],
    [
      'claim count jurisdiction stat with invalid value array',
      scopedCount(ClaimType.Jurisdiction, stat => {
        stat.value = 'not-an-array';
      }),
      ['stats.0.each value in nested property value must be either object or array'],
    ],
    [
      'claim count jurisdiction stat with invalid country code',
      scopedCount(ClaimType.Jurisdiction, stat => {
        stat.value[0].countryCode = 'INVALID';
      }),
      [
        'stats.0.value.0.countryCode must be one of the following values: Af, Ax, Al, Dz, As, Ad, Ao, Ai, Aq, Ag, Ar, Am, Aw, Au, At, Az, Bs, Bh, Bd, Bb, By, Be, Bz, Bj, Bm, Bt, Bo, Ba, Bw, Bv, Br, Vg, Io, Bn, Bg, Bf, Bi, Kh, Cm, Ca, Cv, Ky, Cf, Td, Cl, Cn, Hk, Mo, Cx, Cc, Co, Km, Cg, Cd, Ck, Cr, Ci, Hr, Cu, Cy, Cz, Dk, Dj, Dm, Do, Ec, Eg, Sv, Gq, Er, Ee, Et, Fk, Fo, Fj, Fi, Fr, Gf, Pf, Tf, Ga, Gm, Ge, De, Gh, Gi, Gr, Gl, Gd, Gp, Gu, Gt, Gg, Gn, Gw, Gy, Ht, Hm, Va, Hn, Hu, Is, In, Id, Ir, Iq, Ie, Im, Il, It, Jm, Jp, Je, Jo, Kz, Ke, Ki, Kp, Kr, Kw, Kg, La, Lv, Lb, Ls, Lr, Ly, Li, Lt, Lu, Mk, Mg, Mw, My, Mv, Ml, Mt, Mh, Mq, Mr, Mu, Yt, Mx, Fm, Md, Mc, Mn, Me, Ms, Ma, Mz, Mm, Na, Nr, Np, Nl, An, Nc, Nz, Ni, Ne, Ng, Nu, Nf, Mp, No, Om, Pk, Pw, Ps, Pa, Pg, Py, Pe, Ph, Pn, Pl, Pt, Pr, Qa, Re, Ro, Ru, Rw, Bl, Sh, Kn, Lc, Mf, Pm, Vc, Ws, Sm, St, Sa, Sn, Rs, Sc, Sl, Sg, Sk, Si, Sb, So, Za, Gs, Ss, Es, Lk, Sd, Sr, Sj, Sz, Se, Ch, Sy, Tw, Tj, Tz, Th, Tl, Tg, Tk, To, Tt, Tn, Tr, Tm, Tc, Tv, Ug, Ua, Ae, Gb, Us, Um, Uy, Uz, Vu, Ve, Vn, Vi, Wf, Eh, Ye, Zm, Zw, Bq, Cw, Sx',
      ],
    ],
    [
      'claim count jurisdiction stat with invalid count',
      scopedCount(ClaimType.Jurisdiction, stat => {
        stat.value[0].count = 'not-a-number';
      }),
      ['stats.0.value.0.count must be a number'],
    ],
    [
      'claim percentage stat missing issuer',
      scopedBalance(ClaimType.Jurisdiction, stat => delete stat.issuer),
      [statsDidError(undefined)],
    ],
    ...scopedBalanceIssuerVariants.map(
      ([description, issuer]) =>
        [
          description,
          scopedBalance(ClaimType.Jurisdiction, stat => {
            stat.issuer = issuer;
          }),
          [statsDidError(issuer)],
        ] as InvalidCase
    ),
    [
      'claim percentage stat missing claimType',
      scopedBalance(ClaimType.Accredited, stat => delete stat.claimType),
      [
        'stats.0.claimType must be either null, a Accredited, Affiliate, BuyLockup, SellLockup, CustomerDueDiligence, KnowYourCustomer, Jurisdiction, Exempted, Blocked, or a custom claim object with structure { type: ClaimType.Custom; customClaimTypeId: BigNumber }',
      ],
    ],
    [
      'invalid options type',
      {
        ...statsPayload(countStat()),
        options: 'not-an-object',
      },
      ['nested property options must be either object or array'],
    ],
    [
      'invalid signer type',
      {
        ...statsPayload(countStat()),
        signer: 123,
      },
      ['signer must be a string'],
    ],
  ];

  describe('valid SetStatsDto', () => {
    runValidCases(pipe, metadata, validCases);

    it('transforms scoped count stats into their concrete DTOs', async () => {
      const accreditedDid = '0x0100000000000000000000000000000000000000000000000000000000000000';
      const jurisdictionDid = '0x0600000000000000000000000000000000000000000000000000000000000000';
      const input = statsPayload(
        make(
          () => scopedCountStat(ClaimType.Accredited),
          stat => {
            stat.issuer = accreditedDid;
            stat.value.accredited = '10';
            stat.value.nonAccredited = '5';
          }
        ),
        make(
          () => scopedCountStat(ClaimType.Jurisdiction),
          stat => {
            stat.issuer = jurisdictionDid;
            stat.value[0].count = '25';
          }
        )
      );

      const result = (await pipe.transform(input, metadata)) as SetStatsDto;
      const [accreditedStat, jurisdictionStat] = result.stats;

      expect(accreditedStat).toBeInstanceOf(AddClaimCountAccreditedStatDto);
      const accredited = accreditedStat as unknown as AddClaimCountAccreditedStatDto;
      expect(accredited.issuer).toBe(accreditedDid);
      expect(accredited.value.accredited.toNumber()).toBe(10);
      expect(accredited.value.nonAccredited.toNumber()).toBe(5);

      expect(jurisdictionStat).toBeInstanceOf(AddClaimCountJurisdictionStatDto);
      const jurisdiction = jurisdictionStat as unknown as AddClaimCountJurisdictionStatDto;
      expect(jurisdiction.issuer).toBe(jurisdictionDid);
      expect(jurisdiction.value).toHaveLength(1);
      expect(jurisdiction.value[0].countryCode).toBe(CountryCode.Us);
      expect(jurisdiction.value[0].count.toNumber()).toBe(25);
    });
  });

  describe('invalid SetStatsDto', () => {
    runInvalidCases(pipe, metadata, invalidCases);
  });
});
