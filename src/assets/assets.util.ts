/* istanbul ignore file */

import {
  Asset,
  CreateGroupParams,
  GroupPermissions,
  TransactionPermissions,
} from '@polymeshassociation/polymesh-sdk/types';
import { isFungibleAsset } from '@polymeshassociation/polymesh-sdk/utils';

import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';
import { CreatePermissionGroupDto } from '~/assets/dto/create-permission-group.dto';
import { AssetDetailsModel } from '~/assets/models/asset-details.model';
import { GroupPermissionsModel } from '~/assets/models/group-permissions.model';

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
