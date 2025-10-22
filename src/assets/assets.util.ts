/* istanbul ignore file */

import {
  Asset,
  ClaimType,
  CreateGroupParams,
  GroupPermissions,
  Identity,
  InputStatClaim,
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
