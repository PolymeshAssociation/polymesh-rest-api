import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { PermissionType, SignerType, TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

import { InviteAccountParamsDto } from '~/identities/dto/invite-account-params.dto';
import { DID_LENGTH } from '~/identities/identities.consts';

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
          targetAccount: {
            signerType: SignerType.Account,
            address: '5G9cwcbnffjh9nBnRF1mjr5su78GRcP6tbqrRkVCFhRn1URv',
          },
          signer,
        },
      ],
      [
        'Invite an Identity',
        {
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
          signer,
        },
      ],
      [
        'Invite with tokens permissions',
        {
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
          permissions: {
            transactionGroups: [TxGroup.PortfolioManagement, TxGroup.TokenManagement],
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
        'Invite with invalid Signer Type on targetAccount',
        {
          targetAccount: {
            signerType: 'Invalid Signer Type',
            did: '0x1'.padEnd(66, '0'),
          },
          signer,
        },
        ['targetAccount.signerType must be a valid enum value'],
      ],
      [
        'Invalid DID with signerType Identity',
        {
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x00',
          },
          signer,
        },
        [`targetAccount.DID must be ${DID_LENGTH} characters long`],
      ],
      [
        'Invite without specifying did with signerType Identity',
        {
          targetAccount: {
            signerType: SignerType.Identity,
          },
          signer,
        },
        [
          'targetAccount.DID must be a hexadecimal number',
          'targetAccount.DID must start with "0x"',
          `targetAccount.DID must be ${DID_LENGTH} characters long`,
        ],
      ],
      [
        'Invite without specifying Account address with SignerType Account',
        {
          targetAccount: {
            signerType: SignerType.Account,
          },
          signer,
        },
        ['targetAccount.address must be a string'],
      ],
      [
        'Invite with incorrect Account address with SignerType Account',
        {
          targetAccount: {
            signerType: SignerType.Account,
            address: 12345,
          },
          signer,
        },
        ['targetAccount.address must be a string'],
      ],
      [
        'Invite with tokens permission with incorrect permission type',
        {
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
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
          targetAccount: {
            signerType: SignerType.Identity,
            did: '0x1'.padEnd(66, '0'),
          },
          permissions: {
            transactionGroups: ['Incorrect'],
          },
          signer,
        },
        ['permissions.each value in transactionGroups must be a valid enum value'],
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
