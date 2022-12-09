import {
  Account,
  Asset,
  NumberedPortfolio,
  PermissionedAccount,
  Permissions,
  PermissionType,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { createPermissionedAccountModel, createPermissionsModel } from '~/accounts/accounts.util';
import { AssetPermissionsModel } from '~/accounts/models/asset-permissions.model';
import { PermissionsModel } from '~/accounts/models/permissions.model';
import { PortfolioPermissionsModel } from '~/accounts/models/portfolio-permissions.model';
import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';
import { AccountModel } from '~/identities/models/account.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';
import { testValues } from '~/test-utils/consts';
import { MockAccount, MockAsset, MockPortfolio } from '~/test-utils/mocks';

describe('createPermissionsModel', () => {
  const { did } = testValues;

  it('should transform Permissions to PermissionsModel', () => {
    let permissions: Permissions = {
      assets: {
        type: PermissionType.Include,
        values: [new MockAsset() as unknown as Asset],
      },
      portfolios: {
        type: PermissionType.Include,
        values: [new MockPortfolio() as unknown as NumberedPortfolio],
      },
      transactions: {
        type: PermissionType.Include,
        values: [TxTags.asset.AddDocuments],
      },
      transactionGroups: [TxGroup.Issuance, TxGroup.StoManagement],
    };

    let result = createPermissionsModel(permissions);

    expect(result).toEqual({
      assets: new AssetPermissionsModel({
        type: PermissionType.Include,
        values: ['TICKER'],
      }),
      portfolios: new PortfolioPermissionsModel({
        type: PermissionType.Include,
        values: [
          new PortfolioIdentifierModel({
            id: '1',
            did,
          }),
        ],
      }),
      transactions: new TransactionPermissionsModel({
        type: PermissionType.Include,
        values: [TxTags.asset.AddDocuments],
      }),
      transactionGroups: [TxGroup.Issuance, TxGroup.StoManagement],
    });

    permissions = {
      assets: null,
      portfolios: null,
      transactions: null,
      transactionGroups: [TxGroup.Issuance, TxGroup.StoManagement],
    };

    result = createPermissionsModel(permissions);

    expect(result).toEqual({
      assets: null,
      portfolios: null,
      transactions: null,
      transactionGroups: [],
    });
  });
});

describe('createPermissionedAccountModel', () => {
  it('should transform PermissionedAccount to PermissionedAccountModel', () => {
    const account = new MockAccount() as unknown as Account;
    const permissions = {
      assets: null,
      portfolios: null,
      transactions: null,
      transactionGroups: [],
    };
    const permissionedAccount: PermissionedAccount = {
      account,
      permissions,
    };

    const result = createPermissionedAccountModel(permissionedAccount);

    const { address } = account;
    expect(result).toEqual({
      account: new AccountModel({ address }),
      permissions: new PermissionsModel(permissions),
    });
  });
});
