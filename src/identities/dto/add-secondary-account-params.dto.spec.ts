import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ModuleName,
  PermissionType,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';

type ValidInviteCase = [string, Record<string, unknown>];
type InvalidInviteCase = [string, Record<string, unknown>, string[]];

describe('addSecondaryAccountParamsDto', () => {
  const target: ValidationPipe = new ValidationPipe({ transform: true });
  const signer = '0x6'.padEnd(66, '0');
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: AddSecondaryAccountParamsDto,
    data: '',
  };
  describe('valid invites', () => {
    const cases: ValidInviteCase[] = [
      [
        'Invite a Secondary Account',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          signer,
        },
      ],
      [
        'Invite with Asset permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            assets: {
              values: ['TICKER123456', 'TICKER456789'],
              type: PermissionType.Include,
            },
          },
          signer,
        },
      ],
      [
        'Invite with full assets permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            assets: null,
          },
          signer,
        },
      ],
      [
        'Invite with full portfolios permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            portfolios: null,
          },
          signer,
        },
      ],
      [
        'Invite with portfolios permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            portfolios: {
              values: [
                {
                  id: new BigNumber(1),
                  did: '0x6'.padEnd(66, '0'),
                },
                {
                  id: new BigNumber(2),
                  did: '0x6'.padEnd(66, '0'),
                },
              ],
              type: PermissionType.Exclude,
            },
          },
          signer,
        },
      ],
      [
        'Invite with both assets and portfolios permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            assets: {
              values: ['TICKER123456', 'TICKER456789'],
              type: PermissionType.Include,
            },
            portfolios: {
              values: [
                {
                  id: new BigNumber(1),
                  did: '0x6'.padEnd(66, '0'),
                },
                {
                  id: new BigNumber(2),
                  did: '0x6'.padEnd(66, '0'),
                },
              ],
              type: PermissionType.Exclude,
            },
          },
          signer,
        },
      ],
      [
        'Invite with full assets and portfolios permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            assets: null,
            portfolios: null,
          },
          signer,
        },
      ],
      [
        'Invite with transactionGroups permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactionGroups: [TxGroup.PortfolioManagement, TxGroup.AssetManagement],
          },
          signer,
        },
      ],
      [
        'Invite with transactions permissions with TxTags and without exceptions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: {
              type: PermissionType.Include,
              values: [TxTags.identity.FreezeSecondaryKeys, TxTags.asset.RegisterTicker],
            },
          },
          signer,
        },
      ],
      [
        'Invite with transactions permissions with ModuleNames along with TxTags and without exceptions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: {
              type: PermissionType.Include,
              values: [ModuleName.Identity, TxTags.asset.RegisterTicker],
            },
          },
          signer,
        },
      ],
      [
        'Invite with transactions permissions with ModuleNames along with TxTags and with exceptions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: {
              type: PermissionType.Include,
              values: [ModuleName.Identity, TxTags.asset.RegisterTicker],
              exceptions: [TxTags.identity.LeaveIdentityAsKey],
            },
          },
          signer,
        },
      ],
    ];
    test.each(cases)('%s', async (_, input) => {
      await target.transform(input, metadata).catch(err => {
        fail(`should not make any errors, received: ${JSON.stringify(err.getResponse())}`);
      });
    });
  });

  describe('invalid invites', () => {
    const cases: InvalidInviteCase[] = [
      [
        'Invite with incorrect secondaryAccount',
        {
          secondaryAccount: 123,
          signer,
        },
        ['secondaryAccount must be a string'],
      ],
      [
        'Invite with assets permission with incorrect permission type',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            assets: {
              values: ['TICKER', 'NEWTICKER'],
              type: 'INCORRECT',
            },
          },
          signer,
        },
        ['permissions.assets.type must be a valid enum value'],
      ],
      [
        'Invite with assets permission with incorrect ticker value',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            assets: {
              values: ['invalid', 'TICKERVALUES'],
              type: PermissionType.Exclude,
            },
          },
          signer,
        },
        ['permissions.assets.each value in values must be uppercase'],
      ],
      [
        'Invite with portfolios permissions with no portfolio details',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            portfolios: {
              values: [],
              type: PermissionType.Include,
            },
          },
          signer,
        },
        ['permissions.portfolios.values should not be empty'],
      ],
      [
        'Invite with portfolios permissions with incorrect DID',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            portfolios: {
              values: [
                {
                  id: new BigNumber(1),
                  did: '0x6',
                },
                {
                  id: new BigNumber(2),
                  did: 'DID',
                },
              ],
              type: PermissionType.Exclude,
            },
          },
          signer,
        },
        [
          'permissions.portfolios.values.0.DID must be 66 characters long',
          'permissions.portfolios.values.1.DID must be a hexadecimal number',
          'permissions.portfolios.values.1.DID must start with "0x"',
          'permissions.portfolios.values.1.DID must be 66 characters long',
        ],
      ],
      [
        'Invite with transactionGroups permissions with incorrect groups',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactionGroups: ['Incorrect'],
          },
          signer,
        },
        ['permissions.each value in transactionGroups must be a valid enum value'],
      ],
      [
        'Invite with transactions permissions with incorrect TxTags',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: {
              type: PermissionType.Include,
              values: [TxTags.asset],
            },
          },
          signer,
        },
        [
          'permissions.transactions.values must have all valid enum values from "ModuleName" or "TxTags"',
        ],
      ],
      [
        'Invite with transactions permissions with incorrect exceptions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: {
              type: PermissionType.Include,
              values: [ModuleName.Asset],
              exceptions: [TxTags.asset],
            },
          },
          signer,
        },
        ['permissions.transactions.exceptions must have all valid enum values'],
      ],
      [
        'Invite with transactions permissions with empty transactionGroups',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: {
              type: PermissionType.Include,
              values: [ModuleName.Asset],
              exceptions: [TxTags.asset.RegisterTicker],
            },
            transactionGroups: [],
          },
          signer,
        },
        ["permissions can have either 'transactions' or 'transactionGroups'"],
      ],
      [
        'Invite with transactionGroups permissions and null transactions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: null,
            transactionGroups: [TxGroup.PortfolioManagement],
          },
          signer,
        },
        ["permissions can have either 'transactions' or 'transactionGroups'"],
      ],
      [
        'Invite with null transactions & empty transactionGroups permissions',
        {
          secondaryAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactions: null,
            transactionGroups: [],
          },
          signer,
        },
        ["permissions can have either 'transactions' or 'transactionGroups'"],
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
