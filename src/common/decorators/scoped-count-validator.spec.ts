import { ClaimType, StatType } from '@polymeshassociation/polymesh-sdk/types';
import { validateSync } from 'class-validator';

import { IsScopedCountStat } from '~/common/decorators/scoped-count-validator';

class StatsDto {
  @IsScopedCountStat()
  stats!: unknown[];
}

describe('IsScopedCountStat', () => {
  it('accepts scoped count stats for supported claim types', () => {
    const dto = new StatsDto();
    dto.stats = [
      { type: StatType.Count, count: 1 },
      {
        type: StatType.ScopedCount,
        claimType: ClaimType.Accredited,
        value: { accredited: 1, nonAccredited: 1 },
      },
      {
        type: StatType.ScopedCount,
        claimType: ClaimType.Affiliate,
        value: { affiliate: 1, nonAffiliate: 1 },
      },
      {
        type: StatType.ScopedCount,
        claimType: ClaimType.Jurisdiction,
        value: [{ countryCode: 'US', count: 1 }],
      },
    ];

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects unsupported claim types', () => {
    const dto = new StatsDto();
    dto.stats = [{ type: StatType.ScopedCount, claimType: 'Unknown' }];

    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('rejects non-array values', () => {
    const dto = new StatsDto();
    // @ts-expect-error intentional wrong type
    dto.stats = 'not-an-array';

    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('allows scoped count stats without deep validation of values', () => {
    const dto = new StatsDto();
    dto.stats = [
      { type: StatType.ScopedCount, claimType: ClaimType.Accredited, value: { accredited: 'a' } },
      { type: StatType.ScopedCount, claimType: ClaimType.Affiliate, value: { affiliate: 'b' } },
      {
        type: StatType.ScopedCount,
        claimType: ClaimType.Jurisdiction,
        value: [{ countryCode: 'US' }],
      },
    ];

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('fails when scoped count DTO constructors throw', async () => {
    jest.resetModules();
    jest.doMock(
      '~/assets/dto/transfer-restrictions/stats/add-claim-count-accredited-stat.dto',
      () => ({
        AddClaimCountAccreditedStatDto: class {
          constructor() {
            throw new Error('fail');
          }

          // Dummy property to satisfy linter (class with only constructor)
          readonly type = StatType.ScopedCount;
        },
      })
    );
    jest.doMock(
      '~/assets/dto/transfer-restrictions/stats/add-claim-count-affiliate-stat.dto',
      () => ({
        AddClaimCountAffiliateStatDto: class {
          constructor() {
            throw new Error('fail');
          }

          // Dummy property to satisfy linter (class with only constructor)
          readonly type = StatType.ScopedCount;
        },
      })
    );
    jest.doMock(
      '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto',
      () => ({
        AddClaimCountJurisdictionStatDto: class {
          constructor() {
            throw new Error('fail');
          }

          // Dummy property to satisfy linter (class with only constructor)
          readonly type = StatType.ScopedCount;
        },
      })
    );

    const { IsScopedCountStat: MockedScopedCount } = await import(
      '~/common/decorators/scoped-count-validator'
    );
    class TempDto {
      @MockedScopedCount()
      stats!: unknown[];
    }

    const dto = new TempDto();
    dto.stats = [
      { type: StatType.ScopedCount, claimType: ClaimType.Accredited, value: {} },
      { type: StatType.ScopedCount, claimType: ClaimType.Affiliate, value: {} },
      { type: StatType.ScopedCount, claimType: ClaimType.Jurisdiction, value: {} },
    ];

    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('fails affiliate scoped count when constructor throws', async () => {
    jest.resetModules();
    jest.doMock(
      '~/assets/dto/transfer-restrictions/stats/add-claim-count-affiliate-stat.dto',
      () => ({
        AddClaimCountAffiliateStatDto: class {
          constructor() {
            throw new Error('fail');
          }

          // Dummy property to satisfy linter (class with only constructor)
          readonly type = StatType.ScopedCount;
        },
      })
    );
    const { IsScopedCountStat: MockedScopedCount } = await import(
      '~/common/decorators/scoped-count-validator'
    );
    class TempDto {
      @MockedScopedCount()
      stats!: unknown[];
    }
    const dto = new TempDto();
    dto.stats = [{ type: StatType.ScopedCount, claimType: ClaimType.Affiliate, value: {} }];
    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('fails jurisdiction scoped count when constructor throws', async () => {
    jest.resetModules();
    jest.doMock(
      '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto',
      () => ({
        AddClaimCountJurisdictionStatDto: class {
          constructor() {
            throw new Error('fail');
          }

          // Dummy property to satisfy linter (class with only constructor)
          readonly type = StatType.ScopedCount;
        },
      })
    );
    const { IsScopedCountStat: MockedScopedCount } = await import(
      '~/common/decorators/scoped-count-validator'
    );
    class TempDto {
      @MockedScopedCount()
      stats!: unknown[];
    }
    const dto = new TempDto();
    dto.stats = [{ type: StatType.ScopedCount, claimType: ClaimType.Jurisdiction, value: {} }];
    expect(validateSync(dto)).not.toHaveLength(0);
  });
});
