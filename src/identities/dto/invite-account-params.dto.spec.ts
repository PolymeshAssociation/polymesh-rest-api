import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ModuleName } from '@polymathnetwork/polymesh-sdk/polkadot';
import { PermissionType, TxGroup, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { InviteAccountParamsDto } from '~/identities/dto/invite-account-params.dto';

type ValidInviteCase = [string, Record<string, unknown>];
type InvalidInviteCase = [string, Record<string, unknown>, string[]];

describe('inviteAccountParamsDto', () => {
  const target: ValidationPipe = new ValidationPipe({ transform: true });
  const signer = '0x6'.padEnd(66, '0');
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: InviteAccountParamsDto,
    data: '',
  };
  describe('valid invites', () => {
    const cases: ValidInviteCase[] = [
      [
        'Invite an Account',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          signer,
        },
      ],
      [
        'Invite with tokens permissions',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            tokens: {
              values: ['TICKER123456', 'TICKER456789'],
              type: PermissionType.Include,
            },
          },
          signer,
        },
      ],
      [
        'Invite with portfolios permissions',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
        'Invite with both tokens and portfolios permissions',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            tokens: {
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
        'Invite with transactionGroups permissions',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactionGroups: [TxGroup.PortfolioManagement, TxGroup.TokenManagement],
          },
          signer,
        },
      ],
      [
        'Invite with transactions permissions with TxTags and without exceptions',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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

  describe('invalid account invites', () => {
    const cases: InvalidInviteCase[] = [
      [
        'Invite with incorrect targetAccount',
        {
          targetAccount: 123,
          signer,
        },
        ['targetAccount must be a string'],
      ],
      [
        'Invite with tokens permission with incorrect permission type',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            tokens: {
              values: ['TICKER', 'NEWTICKER'],
              type: 'INCORRECT',
            },
          },
          signer,
        },
        ['permissions.tokens.type must be a valid enum value'],
      ],
      [
        'Invite with tokens permission with no tickers',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            tokens: {
              values: [],
              type: PermissionType.Include,
            },
          },
          signer,
        },
        ['permissions.tokens.values should not be empty'],
      ],
      [
        'Invite with tokens permission with incorrect ticker value',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            tokens: {
              values: ['invalid', 'TICKERVALUES'],
              type: PermissionType.Exclude,
            },
          },
          signer,
        },
        ['permissions.tokens.each value in values must be uppercase'],
      ],
      [
        'Invite with portfolios permissions with no portfolio details',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
        'Invite with transactionGroups permissions with no groups',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          permissions: {
            transactionGroups: [],
          },
          signer,
        },
        ['permissions.transactionGroups should not be empty'],
      ],
      [
        'Invite with transactionGroups permissions with incorrect groups',
        {
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
          targetAccount: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
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
