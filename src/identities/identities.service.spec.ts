/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ErrorCode, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { IdentitiesService } from '~/identities/identities.service';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { mockSigningProvider } from '~/signing/signing.mock';
import { MockIdentity, MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import {
  MockAccountsService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

jest.mock('@polkadot/keyring', () => ({
  ...jest.requireActual('@polkadot/keyring'),
  Keyring: jest.fn().mockImplementation(() => {
    return {
      addFromUri: jest.fn(),
    };
  }),
}));

describe('IdentitiesService', () => {
  let service: IdentitiesService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;
  const mockAccountsService = new MockAccountsService();

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockTransactionsService = mockTransactionsProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [
        IdentitiesService,
        AccountsService,
        mockPolymeshLoggerProvider,
        mockSigningProvider,
        mockTransactionsProvider,
      ],
    })
      .overrideProvider(AccountsService)
      .useValue(mockAccountsService)
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<IdentitiesService>(IdentitiesService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe('if the Identity does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Identity does not exist',
        };
        mockPolymeshApi.identities.getIdentity.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne('falseDid');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
        mockIsPolymeshError.mockReset();
      });
    });
    describe('otherwise', () => {
      it('should return the Identity', async () => {
        const fakeResult = 'identity';

        mockPolymeshApi.identities.getIdentity.mockReturnValue(fakeResult);

        const result = await service.findOne('realDid');

        expect(result).toBe(fakeResult);
      });
    });
  });

  describe('findTrustingAssets', () => {
    it('should return the list of Assets for which the Identity is a default trusted Claim Issuer', async () => {
      const mockAssets = [
        {
          ticker: 'FAKE_TICKER',
        },
        {
          ticker: 'RANDOM_TICKER',
        },
      ];
      const mockIdentity = new MockIdentity();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockIdentity as any);
      mockIdentity.getTrustingAssets.mockResolvedValue(mockAssets);

      const result = await service.findTrustingAssets('TICKER');
      expect(result).toEqual(mockAssets);

      findOneSpy.mockRestore();
    });
  });

  describe('addSecondaryAccount', () => {
    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transaction = {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.identity.JoinIdentityAsKey,
        };
        const mockTransaction = new MockTransaction(transaction);
        mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

        const signer = '0x6'.padEnd(66, '0');
        const body = {
          signer,
          secondaryAccount: 'address',
        };

        const result = await service.addSecondaryAccount(body);
        expect(result).toEqual({
          result: undefined,
          transactions: [mockTransaction],
        });
        expect(mockTransactionsService.submit).toHaveBeenCalled();
      });
    });
  });

  describe('createMockCdd', () => {
    it('should return a promise', async () => {
      const params = {
        address: 'address',
        initialPolyx: new BigNumber(10),
      };
      mockPolymeshApi.network.getSs58Format.mockReturnValue(new BigNumber(42));
      const result = service.createMockCdd(params);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
