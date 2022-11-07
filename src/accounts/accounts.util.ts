import {
  PermissionedAccount,
  Permissions,
  SubsidyWithAllowance,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetPermissionsModel } from '~/accounts/models/asset-permissions.model';
import { PermissionedAccountModel } from '~/accounts/models/permissioned-account.model';
import { PermissionsModel } from '~/accounts/models/permissions.model';
import { PortfolioPermissionsModel } from '~/accounts/models/portfolio-permissions.model';
import { SubsidyModel } from '~/accounts/models/subsidy.model';
import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';
import { AccountModel } from '~/identities/models/account.model';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';

export function createPermissionsModel(permissions: Permissions): PermissionsModel {
  let { assets, portfolios, transactions, transactionGroups } = permissions;

  let assetPermissions: AssetPermissionsModel | null;
  if (assets) {
    const { type, values } = assets;
    assetPermissions = new AssetPermissionsModel({ type, values: values.map(v => v.toHuman()) });
  } else {
    assetPermissions = null;
  }

  let portfolioPermissions: PortfolioPermissionsModel | null;
  if (portfolios) {
    const { type, values } = portfolios;
    portfolioPermissions = new PortfolioPermissionsModel({
      type,
      values: values.map(createPortfolioIdentifierModel),
    });
  } else {
    portfolioPermissions = null;
  }

  let transactionPermissions: TransactionPermissionsModel | null;
  if (transactions) {
    transactionPermissions = new TransactionPermissionsModel(transactions);
  } else {
    transactionPermissions = null;
    transactionGroups = [];
  }

  return new PermissionsModel({
    assets: assetPermissions,
    portfolios: portfolioPermissions,
    transactions: transactionPermissions,
    transactionGroups,
  });
}

export function createPermissionedAccountModel(
  permissionedAccount: PermissionedAccount
): PermissionedAccountModel {
  const {
    account: { address },
    permissions,
  } = permissionedAccount;
  return new PermissionedAccountModel({
    account: new AccountModel({ address }),
    permissions: createPermissionsModel(permissions),
  });
}

export function createSubsidyModel(subsidy: SubsidyWithAllowance): SubsidyModel {
  const {
    subsidy: {
      beneficiary: { address: beneficiaryAddress },
      subsidizer: { address: subsidizerAddress },
    },
    allowance,
  } = subsidy;

  return new SubsidyModel({
    beneficiary: new AccountModel({ address: beneficiaryAddress }),
    subsidizer: new AccountModel({ address: subsidizerAddress }),
    allowance,
  });
}
