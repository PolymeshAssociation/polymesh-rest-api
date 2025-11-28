import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Identity, Signer } from '@polymeshassociation/polymesh-sdk/types';
import { isAccount } from '@polymeshassociation/polymesh-sdk/utils';

import { createIdentityModel, createSignerModel } from '~/identities/identities.util';
import { AccountModel } from '~/identities/models/account.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  isAccount: jest.fn(),
}));

const mockIsAccount = isAccount as unknown as jest.MockedFunction<typeof isAccount>;

describe('identities.util', () => {
  beforeEach(() => {
    mockIsAccount.mockReset();
  });

  it('creates identity models with accounts', async () => {
    mockIsAccount.mockImplementation((val: unknown) =>
      Boolean((val as { address?: string })?.address)
    );
    const identity: DeepMocked<Identity> = createMock<Identity>({
      did: '0x01',
      getPrimaryAccount: jest.fn().mockResolvedValue({
        account: { address: 'addr1' },
        permissions: {
          assets: undefined,
          portfolios: undefined,
          transactions: undefined,
          transactionGroups: [],
        },
      }),
      areSecondaryAccountsFrozen: jest.fn().mockResolvedValue(false),
      getSecondaryAccounts: jest.fn().mockResolvedValue({
        data: [
          {
            account: { address: 'addr2' },
            permissions: {
              assets: undefined,
              portfolios: undefined,
              transactions: undefined,
              transactionGroups: [],
            },
          },
        ],
      }),
    });

    const model = await createIdentityModel(identity);
    expect(model.did).toBe('0x01');
    expect(model.secondaryAccounts).toHaveLength(1);
  });

  it('creates signer models for accounts and identities', () => {
    mockIsAccount.mockImplementation((val: unknown) =>
      Boolean((val as { address?: string })?.address)
    );

    const accountSignerMock = Object.assign(createMock<Signer>(), {
      address: 'addr1',
    }) as Signer;
    const accountSigner = createSignerModel(accountSignerMock) as AccountModel;
    expect(accountSigner.address).toBe('addr1');

    const identitySignerMock = {
      did: 'did',
    } as Signer;
    const identitySigner = createSignerModel(identitySignerMock) as IdentitySignerModel;
    expect(identitySigner.did).toBe('did');
  });
});
