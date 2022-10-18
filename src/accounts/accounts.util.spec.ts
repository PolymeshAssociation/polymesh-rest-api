import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  Asset,
  NumberedPortfolio,
  PermissionedAccount,
  Permissions,
  PermissionType,
  SubsidyWithAllowance,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import {
  createPermissionedAccountModel,
  createPermissionsModel,
  createSubsidyModel,
} from '~/accounts/accounts.util';
import { AssetPermissionsModel } from '~/accounts/models/asset-permissions.model';
import { PermissionsModel } from '~/accounts/models/permissions.model';
import { PortfolioPermissionsModel } from '~/accounts/models/portfolio-permissions.model';
import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';
import { AccountModel } from '~/identities/models/account.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';
import { MockAccount, MockAsset, MockPortfolio, MockSubsidy } from '~/test-utils/mocks';

describe('createPermissionsModel', () => {
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
            did: '0x06'.padEnd(66, '0'),
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

describe('createSubsidyModel', () => {
  it('should transform SubsidyWithAllowance to SubsidyModel', () => {
    const subsidyWithAllowance = {
      subsidy: new MockSubsidy(),
      allowance: new BigNumber(10),
    } as unknown as SubsidyWithAllowance;

    const result = createSubsidyModel(subsidyWithAllowance);

    expect(result).toEqual({
      beneficiary: new AccountModel({ address: 'beneficiary' }),
      subsidizer: new AccountModel({ address: 'subsidizer' }),
      allowance: new BigNumber(10),
    });
  });
});
