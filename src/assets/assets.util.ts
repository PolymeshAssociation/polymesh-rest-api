import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AddClaimCountStatParams,
  AddClaimPercentageStatParams,
  AddCountStatParams,
  AddPercentageStatParams,
  Asset,
  ClaimType,
  CreateGroupParams,
  GroupPermissions,
  Identity,
  InputStatClaim,
  StatType,
  TransactionPermissions,
  TransferRestriction,
  TransferRestrictionClaimCountInput,
  TransferRestrictionInputClaimPercentage,
  TransferRestrictionInputCount,
  TransferRestrictionInputPercentage,
  TransferRestrictionParams,
  TransferRestrictionType,
} from '@polymeshassociation/polymesh-sdk/types';
import { isFungibleAsset } from '@polymeshassociation/polymesh-sdk/utils';

import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';
import {
  StatAccreditedClaimDto,
  StatAffiliateClaimDto,
  StatClaimDto,
  StatJurisdictionClaimDto,
} from '~/assets/dto/stat-claim.dto';
import { SetTransferRestrictionsDto } from '~/assets/dto/transfer-restrictions/set-transfer-restrictions.dto';
import { AssetDetailsModel } from '~/assets/models/asset-details.model';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { CreatePermissionGroupDto } from '~/permission-groups/dto/create-permission-group.dto';
import { GroupPermissionsModel } from '~/permission-groups/models/group-permissions.model';

/**
 * Fetch and assemble data for an Asset
 */
export async function createAssetDetailsModel(asset: Asset): Promise<AssetDetailsModel> {
  const [
    { owner, assetType, name, totalSupply, isDivisible, ticker, fullAgents },
    securityIdentifiers,
    fundingRound,
    isFrozen,
  ] = await Promise.all([
    asset.details(),
    asset.getIdentifiers(),
    isFungibleAsset(asset) ? asset.currentFundingRound() : null,
    asset.isFrozen(),
  ]);

  return new AssetDetailsModel({
    ticker,
    owner,
    assetId: asset.id,
    assetType,
    name,
    totalSupply,
    isDivisible,
    securityIdentifiers,
    fundingRound,
    isFrozen,
    agents: fullAgents.map(agent => agent.did),
  });
}

export function createGroupPermissionsModel(permissions: GroupPermissions): GroupPermissionsModel {
  let { transactions, transactionGroups } = permissions;

  let transactionPermissions: TransactionPermissionsModel | null;
  if (transactions) {
    transactionPermissions = new TransactionPermissionsModel(transactions);
  } else {
    transactionPermissions = null;
    transactionGroups = [];
  }

  return new GroupPermissionsModel({
    transactions: transactionPermissions,
    transactionGroups,
  });
}

export const toPermissionGroupPermissions = (
  input: CreatePermissionGroupDto
): CreateGroupParams['permissions'] => {
  const { transactions, transactionGroups } = input;

  let permissions = {} as CreateGroupParams['permissions'];

  if (transactions) {
    permissions = {
      transactions: transactions.toTransactionPermissions() as TransactionPermissions,
    };
  } else if (transactionGroups) {
    permissions = { transactionGroups };
  }

  return permissions;
};

// Transfer Restrictions helpers

export function normalizeExistingRestrictions(
  restrictions: TransferRestriction[]
): TransferRestrictionParams['restrictions'] {
  return restrictions.map(r => {
    if (r.type === TransferRestrictionType.Count) {
      return {
        type: TransferRestrictionType.Count,
        count: r.value,
      } as TransferRestrictionInputCount;
    }

    if (r.type === TransferRestrictionType.Percentage) {
      return {
        type: TransferRestrictionType.Percentage,
        percentage: r.value,
      } as TransferRestrictionInputPercentage;
    }

    if (r.type === TransferRestrictionType.ClaimCount) {
      return {
        type: TransferRestrictionType.ClaimCount,
        min: r.value.min,
        max: r.value.max,
        issuer: r.value.issuer,
        claim: r.value.claim,
      } as TransferRestrictionClaimCountInput;
    }

    // ClaimPercentage
    return {
      type: TransferRestrictionType.ClaimPercentage,
      min: r.value.min,
      max: r.value.max,
      issuer: r.value.issuer,
      claim: r.value.claim,
    } as TransferRestrictionInputClaimPercentage;
  });
}

export function isSameStatClaim(a: InputStatClaim, b: InputStatClaim): boolean {
  if (a.type === 'Accredited' && b.type === 'Accredited') {
    return a.accredited === b.accredited;
  }
  if (a.type === 'Affiliate' && b.type === 'Affiliate') {
    return a.affiliate === b.affiliate;
  }
  if (a.type === 'Jurisdiction' && b.type === 'Jurisdiction') {
    return a.countryCode === b.countryCode;
  }
  return false;
}

export function isSameRestriction(
  a: TransferRestrictionParams['restrictions'][number],
  b: TransferRestrictionParams['restrictions'][number]
): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case TransferRestrictionType.Count:
      return a.count.eq((b as typeof a).count);
    case TransferRestrictionType.Percentage:
      return a.percentage.eq((b as typeof a).percentage);
    case TransferRestrictionType.ClaimCount: {
      const bb = b as typeof a;
      return (
        a.min.eq(bb.min) &&
        ((a.max === undefined && bb.max === undefined) ||
          (!!a.max && !!bb.max && a.max.eq(bb.max))) &&
        a.issuer.did === bb.issuer.did &&
        isSameStatClaim(a.claim as InputStatClaim, bb.claim as InputStatClaim)
      );
    }
    case TransferRestrictionType.ClaimPercentage: {
      const bb = b as typeof a;
      return (
        a.min.eq(bb.min) &&
        a.max.eq(bb.max) &&
        a.issuer.did === bb.issuer.did &&
        isSameStatClaim(a.claim as InputStatClaim, bb.claim as InputStatClaim)
      );
    }
  }
}

export async function transferRestrictionsDtoToRestrictions(
  input: Omit<SetTransferRestrictionsDto, keyof TransactionBaseDto>,
  resolveIdentity: (did: string) => Promise<Identity>
): Promise<TransferRestrictionParams['restrictions']> {
  const toInputStatClaim = (claim: StatClaimDto): InputStatClaim => {
    switch (claim.type) {
      case ClaimType.Accredited: {
        const accreditedClaim = claim as StatAccreditedClaimDto;
        return {
          type: ClaimType.Accredited,
          accredited: accreditedClaim.accredited,
        };
      }
      case ClaimType.Affiliate: {
        const affiliateClaim = claim as StatAffiliateClaimDto;
        return {
          type: ClaimType.Affiliate,
          affiliate: affiliateClaim.affiliate,
        };
      }
      case ClaimType.Jurisdiction: {
        const jurisdictionClaim = claim as StatJurisdictionClaimDto;
        return {
          type: ClaimType.Jurisdiction,
          countryCode: jurisdictionClaim.countryCode,
        };
      }
      default:
        throw new Error(`Unsupported stat claim type: ${claim.type}`);
    }
  };

  return await Promise.all(
    input.restrictions.map(async restriction => {
      switch (restriction.type) {
        case TransferRestrictionType.Count: {
          const countRestriction: TransferRestrictionInputCount = {
            type: TransferRestrictionType.Count,
            count: restriction.count,
          };
          return countRestriction;
        }
        case TransferRestrictionType.Percentage: {
          const percentageRestriction: TransferRestrictionInputPercentage = {
            type: TransferRestrictionType.Percentage,
            percentage: restriction.percentage,
          };
          return percentageRestriction;
        }
        case TransferRestrictionType.ClaimCount: {
          const issuer = await resolveIdentity(restriction.issuer);
          const claimRestriction: TransferRestrictionClaimCountInput = {
            type: TransferRestrictionType.ClaimCount,
            min: restriction.min,
            max: restriction.max,
            claim: toInputStatClaim(restriction.claim),
            issuer,
          };
          return claimRestriction;
        }
        case TransferRestrictionType.ClaimPercentage: {
          const issuer = await resolveIdentity(restriction.issuer);
          const claimRestriction: TransferRestrictionInputClaimPercentage = {
            type: TransferRestrictionType.ClaimPercentage,
            min: restriction.min,
            max: restriction.max,
            claim: toInputStatClaim(restriction.claim),
            issuer,
          };
          return claimRestriction;
        }
        default:
          throw new Error('Unsupported transfer restriction type');
      }
    })
  );
}

type StatParams =
  | AddCountStatParams
  | AddPercentageStatParams
  | AddClaimCountStatParams
  | AddClaimPercentageStatParams;

type StatParamsWithStringValues =
  | (Omit<AddCountStatParams, 'count'> & { count: string | BigNumber })
  | AddPercentageStatParams
  | (Omit<AddClaimCountStatParams, 'value'> & {
      value:
        | {
            accredited?: string | BigNumber;
            nonAccredited?: string | BigNumber;
            affiliate?: string | BigNumber;
            nonAffiliate?: string | BigNumber;
            [key: string]: unknown;
          }
        | Array<{
            count?: string | BigNumber | number;
            countryCode?: string;
            [key: string]: unknown;
          }>;
    })
  | AddClaimPercentageStatParams;

/**
 * Type guard for AddCountStatParams
 */
function isAddCountStatParams(
  stat: unknown
): stat is StatParamsWithStringValues & { type: StatType.Count } {
  return (
    typeof stat === 'object' &&
    stat !== null &&
    'type' in stat &&
    (stat as { type: unknown }).type === StatType.Count &&
    'count' in stat
  );
}

/**
 * Type guard for AddPercentageStatParams
 */
function isAddPercentageStatParams(stat: unknown): stat is AddPercentageStatParams {
  return (
    typeof stat === 'object' &&
    stat !== null &&
    'type' in stat &&
    (stat as { type: unknown }).type === StatType.Balance
  );
}

/**
 * Type guard for AddClaimCountStatParams
 */
function isAddClaimCountStatParams(
  stat: unknown
): stat is StatParamsWithStringValues & { type: StatType.ScopedCount } {
  return (
    typeof stat === 'object' &&
    stat !== null &&
    'type' in stat &&
    (stat as { type: unknown }).type === StatType.ScopedCount &&
    'value' in stat
  );
}

/**
 * Type guard for AddClaimPercentageStatParams
 */
function isAddClaimPercentageStatParams(stat: unknown): stat is AddClaimPercentageStatParams {
  return (
    typeof stat === 'object' &&
    stat !== null &&
    'type' in stat &&
    (stat as { type: unknown }).type === StatType.ScopedBalance
  );
}

/**
 * Converts string count values to BigNumber for Count stats
 */
function convertCountStat(
  stat: StatParamsWithStringValues & { type: StatType.Count }
): AddCountStatParams {
  const count = typeof stat.count === 'string' ? new BigNumber(stat.count) : stat.count;
  return {
    ...stat,
    count,
  };
}

/**
 * Converts string values to BigNumber for ScopedCount stats
 */
function convertScopedCountStat(
  stat: StatParamsWithStringValues & { type: StatType.ScopedCount }
): AddClaimCountStatParams {
  if (!stat.value) {
    return stat as AddClaimCountStatParams;
  }

  // Handle object value (Accredited or Affiliate claim types)
  if (typeof stat.value === 'object' && !Array.isArray(stat.value)) {
    const valueObj = stat.value as Record<string, unknown>;
    const transformedValue: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(valueObj)) {
      if (
        typeof val === 'string' &&
        (key === 'accredited' ||
          key === 'nonAccredited' ||
          key === 'affiliate' ||
          key === 'nonAffiliate')
      ) {
        transformedValue[key] = new BigNumber(val);
      } else {
        transformedValue[key] = val;
      }
    }

    return {
      ...stat,
      value: transformedValue,
    } as AddClaimCountStatParams;
  }

  // Handle array value (Jurisdiction claim type)
  if (Array.isArray(stat.value)) {
    const transformedValue = stat.value.map(item => {
      if (typeof item === 'object' && item !== null && 'count' in item) {
        const count = typeof item.count === 'string' ? new BigNumber(item.count) : item.count;
        return {
          ...item,
          count,
        };
      }
      return item;
    });

    return {
      ...stat,
      value: transformedValue,
    } as AddClaimCountStatParams;
  }

  return stat as AddClaimCountStatParams;
}

/**
 * Ensures BigNumber conversions are applied to stats.
 * Converts string values to BigNumber instances where needed.
 */
export function ensureStatsBigNumberConversion(stats: StatParamsWithStringValues[]): StatParams[] {
  return stats.map(stat => {
    if (isAddCountStatParams(stat)) {
      return convertCountStat(stat);
    }

    if (isAddClaimCountStatParams(stat)) {
      return convertScopedCountStat(stat);
    }

    if (isAddPercentageStatParams(stat) || isAddClaimPercentageStatParams(stat)) {
      return stat;
    }

    // Unknown stat type - throw validation error
    const statType =
      typeof stat === 'object' && stat !== null && 'type' in stat
        ? (stat as { type: unknown }).type
        : 'unknown';
    throw new Error(
      `Unsupported stat type: ${statType}. Expected one of: Count, Balance, ScopedCount, ScopedBalance`
    );
  });
}
