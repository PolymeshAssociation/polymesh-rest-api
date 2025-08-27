import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
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
      [
        'Custom claim with `customClaimTypeId`',
        {
          type: ClaimType.Custom,
          scope,
          customClaimTypeId: new BigNumber('1'),
        },
      ],
      [
        'Custom claim with `customClaimTypeId` and no `scope`',
        {
          type: ClaimType.Custom,
          customClaimTypeId: new BigNumber('1'),
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
        [
          'code must be one of the following values: Af, Ax, Al, Dz, As, Ad, Ao, Ai, Aq, Ag, Ar, Am, Aw, Au, At, Az, Bs, Bh, Bd, Bb, By, Be, Bz, Bj, Bm, Bt, Bo, Ba, Bw, Bv, Br, Vg, Io, Bn, Bg, Bf, Bi, Kh, Cm, Ca, Cv, Ky, Cf, Td, Cl, Cn, Hk, Mo, Cx, Cc, Co, Km, Cg, Cd, Ck, Cr, Ci, Hr, Cu, Cy, Cz, Dk, Dj, Dm, Do, Ec, Eg, Sv, Gq, Er, Ee, Et, Fk, Fo, Fj, Fi, Fr, Gf, Pf, Tf, Ga, Gm, Ge, De, Gh, Gi, Gr, Gl, Gd, Gp, Gu, Gt, Gg, Gn, Gw, Gy, Ht, Hm, Va, Hn, Hu, Is, In, Id, Ir, Iq, Ie, Im, Il, It, Jm, Jp, Je, Jo, Kz, Ke, Ki, Kp, Kr, Kw, Kg, La, Lv, Lb, Ls, Lr, Ly, Li, Lt, Lu, Mk, Mg, Mw, My, Mv, Ml, Mt, Mh, Mq, Mr, Mu, Yt, Mx, Fm, Md, Mc, Mn, Me, Ms, Ma, Mz, Mm, Na, Nr, Np, Nl, An, Nc, Nz, Ni, Ne, Ng, Nu, Nf, Mp, No, Om, Pk, Pw, Ps, Pa, Pg, Py, Pe, Ph, Pn, Pl, Pt, Pr, Qa, Re, Ro, Ru, Rw, Bl, Sh, Kn, Lc, Mf, Pm, Vc, Ws, Sm, St, Sa, Sn, Rs, Sc, Sl, Sg, Sk, Si, Sb, So, Za, Gs, Ss, Es, Lk, Sd, Sr, Sj, Sz, Se, Ch, Sy, Tw, Tj, Tz, Th, Tl, Tg, Tk, To, Tt, Tn, Tr, Tm, Tc, Tv, Ug, Ua, Ae, Gb, Us, Um, Uy, Uz, Vu, Ve, Vn, Vi, Wf, Eh, Ye, Zm, Zw, Bq, Cw, Sx',
        ],
      ],
      [
        'Jurisdiction claim with bad `code`',
        {
          type: ClaimType.Jurisdiction,
          scope,
          code: '123',
        },
        [
          'code must be one of the following values: Af, Ax, Al, Dz, As, Ad, Ao, Ai, Aq, Ag, Ar, Am, Aw, Au, At, Az, Bs, Bh, Bd, Bb, By, Be, Bz, Bj, Bm, Bt, Bo, Ba, Bw, Bv, Br, Vg, Io, Bn, Bg, Bf, Bi, Kh, Cm, Ca, Cv, Ky, Cf, Td, Cl, Cn, Hk, Mo, Cx, Cc, Co, Km, Cg, Cd, Ck, Cr, Ci, Hr, Cu, Cy, Cz, Dk, Dj, Dm, Do, Ec, Eg, Sv, Gq, Er, Ee, Et, Fk, Fo, Fj, Fi, Fr, Gf, Pf, Tf, Ga, Gm, Ge, De, Gh, Gi, Gr, Gl, Gd, Gp, Gu, Gt, Gg, Gn, Gw, Gy, Ht, Hm, Va, Hn, Hu, Is, In, Id, Ir, Iq, Ie, Im, Il, It, Jm, Jp, Je, Jo, Kz, Ke, Ki, Kp, Kr, Kw, Kg, La, Lv, Lb, Ls, Lr, Ly, Li, Lt, Lu, Mk, Mg, Mw, My, Mv, Ml, Mt, Mh, Mq, Mr, Mu, Yt, Mx, Fm, Md, Mc, Mn, Me, Ms, Ma, Mz, Mm, Na, Nr, Np, Nl, An, Nc, Nz, Ni, Ne, Ng, Nu, Nf, Mp, No, Om, Pk, Pw, Ps, Pa, Pg, Py, Pe, Ph, Pn, Pl, Pt, Pr, Qa, Re, Ro, Ru, Rw, Bl, Sh, Kn, Lc, Mf, Pm, Vc, Ws, Sm, St, Sa, Sn, Rs, Sc, Sl, Sg, Sk, Si, Sb, So, Za, Gs, Ss, Es, Lk, Sd, Sr, Sj, Sz, Se, Ch, Sy, Tw, Tj, Tz, Th, Tl, Tg, Tk, To, Tt, Tn, Tr, Tm, Tc, Tv, Ug, Ua, Ae, Gb, Us, Um, Uy, Uz, Vu, Ve, Vn, Vi, Wf, Eh, Ye, Zm, Zw, Bq, Cw, Sx',
        ],
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
        ['scope.type must be one of the following values: Identity, Asset, Custom'],
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
        [
          'trustedClaimIssuers.0.trustedFor must be either null, a Accredited, Affiliate, BuyLockup, SellLockup, CustomerDueDiligence, KnowYourCustomer, Jurisdiction, Exempted, Blocked, or a custom claim object with structure { type: ClaimType.Custom; customClaimTypeId: BigNumber }',
        ],
      ],
      [
        'Custom with empty `scope`',
        {
          type: ClaimType.Custom,
          scope: {},
          customClaimTypeId: new BigNumber('1'),
        },
        ['scope.type must be one of the following values: Identity, Asset, Custom'],
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
