import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AddBalanceStatParams,
  AddClaimBalanceStatParams,
  AddClaimCountStatParams,
  AddCountStatParams,
  Asset,
  ClaimType,
  CountryCode,
  GroupPermissions,
  Identity,
  InputStatClaim,
  StatType,
  TransferRestriction,
  TransferRestrictionParams,
  TransferRestrictionType,
} from '@polymeshassociation/polymesh-sdk/types';
import { isFungibleAsset } from '@polymeshassociation/polymesh-sdk/utils';

import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';
import {
  createAssetDetailsModel,
  createGroupPermissionsModel,
  ensureStatsBigNumberConversion,
  isSameRestriction,
  isSameStatClaim,
  normalizeExistingRestrictions,
  toPermissionGroupPermissions,
  transferRestrictionsDtoToRestrictions,
} from '~/assets/assets.util';
import { SetTransferRestrictionsDto } from '~/assets/dto/transfer-restrictions/set-transfer-restrictions.dto';
import { CreatePermissionGroupDto } from '~/permission-groups/dto/create-permission-group.dto';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  isFungibleAsset: jest.fn(),
}));

const mockIsFungibleAsset = isFungibleAsset as unknown as jest.MockedFunction<
  typeof isFungibleAsset
>;

describe('assets.util', () => {
  beforeEach(() => {
    mockIsFungibleAsset.mockReset();
  });

  it('creates asset details including funding round for fungible assets', async () => {
    mockIsFungibleAsset.mockReturnValue(true);
    const asset: DeepMocked<Asset> = createMock<Asset>({
      id: 'ASSET-ID',
      details: jest.fn().mockResolvedValue({
        owner: 'owner',
        assetType: 'Equity',
        name: 'Asset',
        totalSupply: new BigNumber(1000),
        isDivisible: true,
        ticker: 'TICKER',
        fullAgents: [{ did: 'agent1' }],
      }),
      getIdentifiers: jest.fn().mockResolvedValue(['ISIN']),
      currentFundingRound: jest.fn().mockResolvedValue('Series A'),
      isFrozen: jest.fn().mockResolvedValue(false),
    });

    const model = await createAssetDetailsModel(asset);

    expect(asset.currentFundingRound).toHaveBeenCalled();
    expect(model).toMatchObject({
      fundingRound: 'Series A',
      agents: ['agent1'],
      ticker: 'TICKER',
    });
  });

  it('creates asset details without funding round for non-fungible assets', async () => {
    mockIsFungibleAsset.mockReturnValue(false);
    const asset: DeepMocked<Asset> = createMock<Asset>({
      id: 'ASSET-ID',
      details: jest.fn().mockResolvedValue({
        owner: 'owner',
        assetType: 'NFT',
        name: 'NFTAsset',
        totalSupply: new BigNumber(1),
        isDivisible: false,
        ticker: 'NFT1',
        fullAgents: [],
      }),
      getIdentifiers: jest.fn().mockResolvedValue([]),
      currentFundingRound: jest.fn(),
      isFrozen: jest.fn().mockResolvedValue(true),
    });

    const model = await createAssetDetailsModel(asset);
    expect(asset.currentFundingRound).not.toHaveBeenCalled();
    expect(model.fundingRound).toBeNull();
    expect(model.isFrozen).toBe(true);
  });

  it('creates group permission models with transactions', () => {
    const permissions = createGroupPermissionsModel({
      transactions: { values: ['tx'] } as unknown as GroupPermissions['transactions'],
      transactionGroups: ['group'] as unknown as GroupPermissions['transactionGroups'],
    });

    expect(permissions.transactions).toBeInstanceOf(TransactionPermissionsModel);
    expect(permissions.transactionGroups).toEqual(['group']);
  });

  it('maps group permission input using transactionGroups fallback', () => {
    const result = toPermissionGroupPermissions({
      transactionGroups: ['groupA'],
    } as unknown as CreatePermissionGroupDto);

    expect(result).toMatchObject({ transactionGroups: ['groupA'] });
  });

  it('normalizes existing restrictions', () => {
    const restrictions: TransferRestriction[] = [
      { type: TransferRestrictionType.Count, value: new BigNumber(1) },
      { type: TransferRestrictionType.Percentage, value: new BigNumber(5) },
      {
        type: TransferRestrictionType.ClaimCount,
        value: {
          min: new BigNumber(1),
          max: new BigNumber(2),
          issuer: { did: 'did' } as Identity,
          claim: { type: ClaimType.Affiliate, affiliate: true },
        },
      },
      {
        type: TransferRestrictionType.ClaimPercentage,
        value: {
          min: new BigNumber(1),
          max: new BigNumber(3),
          issuer: { did: 'did2' } as Identity,
          claim: { type: ClaimType.Accredited, accredited: true },
        },
      },
    ];
    const normalized = normalizeExistingRestrictions(restrictions);

    expect(normalized[0]).toMatchObject({
      type: TransferRestrictionType.Count,
      count: expect.any(BigNumber),
    });
    expect(normalized[1]).toMatchObject({
      type: TransferRestrictionType.Percentage,
      percentage: expect.any(BigNumber),
    });
    expect(normalized[2]).toMatchObject({
      type: TransferRestrictionType.ClaimCount,
      issuer: { did: 'did' },
    });
    expect(normalized[3]).toMatchObject({
      type: TransferRestrictionType.ClaimPercentage,
      issuer: { did: 'did2' },
    });
  });

  it('compares stat claims and restrictions correctly', () => {
    const accredited: InputStatClaim = { type: ClaimType.Accredited, accredited: true };
    const affiliate: InputStatClaim = { type: ClaimType.Affiliate, affiliate: true };
    const jurisdiction: InputStatClaim = {
      type: ClaimType.Jurisdiction,
      countryCode: CountryCode.Us,
    };

    expect(isSameStatClaim(accredited, { ...accredited })).toBe(true);
    expect(isSameStatClaim(accredited, affiliate)).toBe(false);
    expect(isSameStatClaim(affiliate, { ...affiliate })).toBe(true);
    expect(isSameStatClaim(jurisdiction, { ...jurisdiction })).toBe(true);

    type Restriction = TransferRestrictionParams['restrictions'][number];
    const count: Restriction = { type: TransferRestrictionType.Count, count: new BigNumber(1) };
    const percentage: Restriction = {
      type: TransferRestrictionType.Percentage,
      percentage: new BigNumber(5),
    };
    const claimPercentA: Restriction = {
      type: TransferRestrictionType.ClaimPercentage,
      min: new BigNumber(1),
      max: new BigNumber(2),
      issuer: { did: 'did' } as Identity,
      claim: { type: ClaimType.Accredited, accredited: true },
    };
    const claimPercentB: Restriction = {
      ...claimPercentA,
      issuer: { did: 'other' } as Identity,
    };
    const claimPercentC: Restriction = {
      type: TransferRestrictionType.ClaimPercentage,
      min: new BigNumber(1),
      max: new BigNumber(2),
      issuer: { did: 'did' } as Identity,
      claim: { type: ClaimType.Affiliate, affiliate: true },
    };
    const claimPercentD: Restriction = { ...claimPercentC };
    const claimCountA: Restriction = {
      type: TransferRestrictionType.ClaimCount,
      min: new BigNumber(1),
      max: new BigNumber(2),
      issuer: { did: 'did' } as Identity,
      claim: { type: ClaimType.Affiliate, affiliate: true },
    };
    const claimCountB: Restriction = { ...claimCountA };
    const claimCountNoMax: Restriction = {
      type: TransferRestrictionType.ClaimCount,
      min: new BigNumber(1),
      max: undefined,
      issuer: { did: 'same' } as Identity,
      claim: { type: ClaimType.Accredited, accredited: true },
    };

    expect(isSameRestriction(count, { ...count })).toBe(true);
    expect(isSameRestriction(percentage, { ...percentage })).toBe(true);
    expect(isSameRestriction(count, percentage)).toBe(false);

    expect(isSameRestriction(claimPercentA, claimPercentB)).toBe(false);
    expect(isSameRestriction(claimPercentC, claimPercentD)).toBe(true);
    expect(isSameRestriction(claimCountA, claimCountB)).toBe(true);
    expect(isSameRestriction(claimCountNoMax, { ...claimCountNoMax })).toBe(true);
  });

  it('converts stats string values to BigNumber where needed', () => {
    const stats: (
      | AddCountStatParams
      | AddBalanceStatParams
      | AddClaimCountStatParams
      | AddClaimBalanceStatParams
    )[] = [
      { type: 'Count', count: new BigNumber(10) } as AddCountStatParams,
      {
        type: 'ScopedCount',
        value: { accredited: '5', nonAccredited: '3', affiliate: '2', nonAffiliate: '1' },
      } as unknown as AddClaimCountStatParams,
      {
        type: 'ScopedCount',
        value: [{ countryCode: 'US', count: '7' }],
      } as unknown as AddClaimCountStatParams,
      {
        type: 'ScopedCount',
        value: { accredited: '1', other: true },
      } as unknown as AddClaimCountStatParams,
      {
        type: 'ScopedCount',
        value: [{ countryCode: 'CA', count: 3 }],
      } as unknown as AddClaimCountStatParams,
    ];

    const converted = ensureStatsBigNumberConversion(stats);

    expect((converted[0] as AddCountStatParams).count).toBeInstanceOf(BigNumber);
    const scoped = converted[1] as AddClaimCountStatParams & {
      value: {
        accredited: BigNumber;
        nonAccredited: BigNumber;
        affiliate: BigNumber;
        nonAffiliate: BigNumber;
      };
    };
    expect(scoped.value.accredited).toBeInstanceOf(BigNumber);
    expect(scoped.value.nonAffiliate).toBeInstanceOf(BigNumber);
    expect(
      ((converted[2] as AddClaimCountStatParams).value as { count: BigNumber }[])[0].count
    ).toBeInstanceOf(BigNumber);
    expect((converted[3] as AddClaimCountStatParams).value).toMatchObject({ other: true });
    const countValue = ((converted[4] as AddClaimCountStatParams).value as { count: unknown }[])[0]
      .count;
    const numericCount =
      countValue instanceof BigNumber ? countValue.toNumber() : (countValue as number);
    expect(numericCount).toEqual(3);
  });

  it('resolves claim restrictions using resolver', async () => {
    const result = await transferRestrictionsDtoToRestrictions(
      {
        restrictions: [
          {
            type: TransferRestrictionType.Count,
            count: new BigNumber(1),
          },
          {
            type: TransferRestrictionType.Percentage,
            percentage: new BigNumber(5),
          },
          {
            type: TransferRestrictionType.ClaimCount,
            min: new BigNumber(1),
            max: new BigNumber(2),
            issuer: 'did',
            claim: { type: ClaimType.Accredited, accredited: true },
          },
          {
            type: TransferRestrictionType.ClaimPercentage,
            min: new BigNumber(1),
            max: new BigNumber(3),
            issuer: 'did2',
            claim: { type: ClaimType.Affiliate, affiliate: true },
          },
          {
            type: TransferRestrictionType.ClaimCount,
            min: new BigNumber(1),
            max: new BigNumber(2),
            issuer: 'did3',
            claim: { type: ClaimType.Jurisdiction, countryCode: 'US' },
          },
        ],
      } as unknown as SetTransferRestrictionsDto,
      async (did: string): Promise<Identity> => ({ did } as Identity)
    );

    expect(result[0]).toMatchObject({
      type: TransferRestrictionType.Count,
      count: new BigNumber(1),
    });
    expect(result[1]).toMatchObject({
      type: TransferRestrictionType.Percentage,
    });
    expect(result[2]).toMatchObject({
      type: TransferRestrictionType.ClaimCount,
      issuer: { did: 'did' },
    });
    expect(result[3]).toMatchObject({
      type: TransferRestrictionType.ClaimPercentage,
      issuer: { did: 'did2' },
    });
    expect(result[4]).toMatchObject({
      type: TransferRestrictionType.ClaimCount,
      issuer: { did: 'did3' },
      claim: { countryCode: 'US' },
    });
  });

  it('throws on unsupported stat claim type', async () => {
    await expect(
      transferRestrictionsDtoToRestrictions(
        {
          restrictions: [
            {
              type: TransferRestrictionType.ClaimCount,
              min: new BigNumber(1),
              max: new BigNumber(2),
              issuer: 'did',
              claim: { type: 'Unknown' },
            },
          ],
        } as unknown as SetTransferRestrictionsDto,
        async (did: string): Promise<Identity> => ({ did } as Identity)
      )
    ).rejects.toThrow('Unsupported stat claim type');
  });

  it('throws on unsupported restriction type', async () => {
    await expect(
      transferRestrictionsDtoToRestrictions(
        { restrictions: [{ type: 'BadType' }] } as unknown as SetTransferRestrictionsDto,
        async (did: string): Promise<Identity> => ({ did } as Identity)
      )
    ).rejects.toThrow('Unsupported transfer restriction type');
  });

  describe('ensureStatsBigNumberConversion edge cases', () => {
    it('handles Count stat with string count value', () => {
      const stats = [{ type: StatType.Count, count: '100' } as unknown as AddCountStatParams];

      const converted = ensureStatsBigNumberConversion(stats);

      expect(converted).toHaveLength(1);
      expect((converted[0] as AddCountStatParams).count).toBeInstanceOf(BigNumber);
      expect((converted[0] as AddCountStatParams).count!.toString()).toBe('100');
    });

    it('handles Count stat with BigNumber count value (already converted)', () => {
      const stats = [
        { type: StatType.Count, count: new BigNumber(50) } as unknown as AddCountStatParams,
      ];

      const converted = ensureStatsBigNumberConversion(stats);

      expect(converted).toHaveLength(1);
      expect((converted[0] as AddCountStatParams).count).toBeInstanceOf(BigNumber);
      expect((converted[0] as AddCountStatParams).count!.toString()).toBe('50');
    });

    it('handles Balance stat type (AddPercentageStatParams)', () => {
      const stats = [{ type: StatType.Balance } as AddBalanceStatParams];

      const converted = ensureStatsBigNumberConversion(stats);

      expect(converted).toHaveLength(1);
      expect(converted[0]).toEqual({ type: StatType.Balance });
    });

    it('handles ScopedBalance stat type (AddClaimPercentageStatParams)', () => {
      const mockIdentity = { did: '0x123' } as Identity;
      const stats = [
        {
          type: StatType.ScopedBalance,
          issuer: mockIdentity,
          claimType: ClaimType.Accredited,
        } as AddClaimBalanceStatParams,
      ];

      const converted = ensureStatsBigNumberConversion(stats);

      expect(converted).toHaveLength(1);
      expect(converted[0]).toEqual({
        type: StatType.ScopedBalance,
        issuer: mockIdentity,
        claimType: ClaimType.Accredited,
      });
    });

    it('handles ScopedCount stat with null value', () => {
      const stats = [
        {
          type: StatType.ScopedCount,
          value: null,
        } as unknown as AddClaimCountStatParams,
      ];

      const converted = ensureStatsBigNumberConversion(stats);

      expect(converted).toHaveLength(1);
      expect(converted[0].type).toBe(StatType.ScopedCount);
    });

    it('handles ScopedCount array value with items without count property', () => {
      const stats = [
        {
          type: StatType.ScopedCount,
          value: [{ countryCode: 'US' }, { countryCode: 'CA', count: '5' }],
        } as unknown as AddClaimCountStatParams,
      ];

      const converted = ensureStatsBigNumberConversion(stats);

      expect(converted).toHaveLength(1);
      const value = (converted[0] as AddClaimCountStatParams).value;
      expect(Array.isArray(value)).toBe(true);
      if (Array.isArray(value)) {
        expect(value[0]).toEqual({ countryCode: 'US' });
        expect(value[1]).toMatchObject({ countryCode: 'CA' });
        expect(value[1].count).toBeInstanceOf(BigNumber);
      }
    });

    it('handles ScopedCount with value that is neither object nor array (string)', () => {
      const stats = [
        {
          type: StatType.ScopedCount,
          value: 'invalid',
        } as unknown as AddClaimCountStatParams,
      ];

      const converted = ensureStatsBigNumberConversion(stats);

      expect(converted).toHaveLength(1);
      expect(converted[0].type).toBe(StatType.ScopedCount);
    });

    it('throws error for unsupported stat type', () => {
      const stats = [{ type: 'InvalidType' } as unknown as AddCountStatParams];

      expect(() => ensureStatsBigNumberConversion(stats)).toThrow(
        'Unsupported stat type: InvalidType. Expected one of: Count, Balance, ScopedCount, ScopedBalance'
      );
    });

    it('throws error for stat without type property', () => {
      const stats = [{} as unknown as AddCountStatParams];

      expect(() => ensureStatsBigNumberConversion(stats)).toThrow(
        'Unsupported stat type: unknown. Expected one of: Count, Balance, ScopedCount, ScopedBalance'
      );
    });

    it('throws error for null stat', () => {
      const stats = [null as unknown as AddCountStatParams];

      expect(() => ensureStatsBigNumberConversion(stats)).toThrow(
        'Unsupported stat type: unknown. Expected one of: Count, Balance, ScopedCount, ScopedBalance'
      );
    });
  });
});
