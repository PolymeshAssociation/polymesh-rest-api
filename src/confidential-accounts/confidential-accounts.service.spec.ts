import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ConfidentialAccount,
  ConfidentialAssetBalance,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import {
  createMockConfidentialAccount,
  createMockConfidentialAsset,
  MockPolymesh,
  MockTransaction,
} from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import { TransactionsService } from '~/transactions/transactions.service';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { signer } = testValues;

describe('ConfidentialAccountsService', () => {
  let service: ConfidentialAccountsService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;
  let mockTransactionsService: MockTransactionsService;
  const confidentialAccount = 'SOME_PUBLIC_KEY';

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [ConfidentialAccountsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    mockPolymeshApi = module.get<MockPolymesh>(POLYMESH_API);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockTransactionsService = module.get<MockTransactionsService>(TransactionsService);

    service = module.get<ConfidentialAccountsService>(ConfidentialAccountsService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a Confidential Account for a valid publicKey', async () => {
      const account = createMockConfidentialAccount();
      mockPolymeshApi.confidentialAccounts.getConfidentialAccount.mockResolvedValue(account);

      const result = await service.findOne(confidentialAccount);

      expect(result).toEqual(account);
    });

    it('should call handleSdkError and throw an error', async () => {
      const mockError = new Error('Some Error');
      mockPolymeshApi.confidentialAccounts.getConfidentialAccount.mockRejectedValue(mockError);

      const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

      await expect(service.findOne(confidentialAccount)).rejects.toThrowError();

      expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('fetchOwner', () => {
    it('should return the owner of Confidential Account', async () => {
      const mockConfidentialAccount = createMockConfidentialAccount();

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockConfidentialAccount);

      const result = await service.fetchOwner(confidentialAccount);

      expect(result).toEqual(expect.objectContaining({ did: 'SOME_OWNER' }));
    });

    it('should throw an error if no owner exists', async () => {
      const mockConfidentialAccount = createMockConfidentialAccount();
      mockConfidentialAccount.getIdentity.mockResolvedValue(null);

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockConfidentialAccount);

      await expect(service.fetchOwner(confidentialAccount)).rejects.toThrow(
        'No owner exists for the Confidential Account'
      );
    });
  });

  describe('linkConfidentialAccount', () => {
    it('should link a given public key to the signer', async () => {
      const input = {
        signer,
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.confidentialAsset.CreateAccount,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockAccount = createMockConfidentialAccount();

      mockTransactionsService.submit.mockResolvedValue({
        result: mockAccount,
        transactions: [mockTransaction],
      });

      const result = await service.linkConfidentialAccount(confidentialAccount, input);

      expect(result).toEqual({
        result: mockAccount,
        transactions: [mockTransaction],
      });
    });
  });

  describe('getAllBalances and getAllIncomingBalances', () => {
    let account: DeepMocked<ConfidentialAccount>;
    let balances: ConfidentialAssetBalance[];

    beforeEach(() => {
      balances = [
        {
          confidentialAsset: createMockConfidentialAsset(),
          balance: '0xsomebalance',
        },
      ];

      account = createMockConfidentialAccount();
    });

    describe('getAllBalances', () => {
      it('should return all balances for a Confidential Account', async () => {
        account.getBalances.mockResolvedValue(balances);

        jest.spyOn(service, 'findOne').mockResolvedValue(account);

        const result = await service.getAllBalances(confidentialAccount);

        expect(result).toEqual(balances);
      });
    });

    describe('getAllIncomingBalances', () => {
      it('should return all incoming balances for a Confidential Account', async () => {
        account.getIncomingBalances.mockResolvedValue(balances);

        jest.spyOn(service, 'findOne').mockResolvedValue(account);

        const result = await service.getAllIncomingBalances(confidentialAccount);

        expect(result).toEqual(balances);
      });
    });
  });

  describe('getAssetBalance and getIncomingAssetBalance', () => {
    let account: DeepMocked<ConfidentialAccount>;
    let balance: string;
    let confidentialAssetId: string;

    beforeEach(() => {
      balance = '0xsomebalance';
      confidentialAssetId = 'SOME_ASSET_ID';

      account = createMockConfidentialAccount();
      account.getBalance.mockResolvedValue(balance);
      account.getIncomingBalance.mockResolvedValue(balance);
    });

    describe('getAssetBalance', () => {
      it('should return balance for a specific Confidential Asset', async () => {
        jest.spyOn(service, 'findOne').mockResolvedValue(account);

        const result = await service.getAssetBalance(confidentialAccount, confidentialAssetId);

        expect(result).toEqual(balance);
      });

      it('should call handleSdkError and throw an error', async () => {
        const mockError = new Error('Some Error');
        account.getBalance.mockRejectedValue(mockError);
        jest.spyOn(service, 'findOne').mockResolvedValue(account);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(
          service.getAssetBalance(confidentialAccount, confidentialAssetId)
        ).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });

    describe('getIncomingAssetBalance', () => {
      it('should return the incoming balance for a specific Confidential Asset', async () => {
        jest.spyOn(service, 'findOne').mockResolvedValue(account);

        const result = await service.getIncomingAssetBalance(
          confidentialAccount,
          confidentialAssetId
        );

        expect(result).toEqual(balance);
      });

      it('should call handleSdkError and throw an error', async () => {
        const mockError = new Error('Some Error');
        account.getIncomingBalance.mockRejectedValue(mockError);
        jest.spyOn(service, 'findOne').mockResolvedValue(account);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(
          service.getIncomingAssetBalance(confidentialAccount, confidentialAssetId)
        ).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('applyAllIncomingAssetBalances', () => {
    it('should deposit all incoming balances for a Confidential Account', async () => {
      const input = {
        signer,
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.confidentialAsset.ApplyIncomingBalances,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockAccount = createMockConfidentialAccount();

      mockTransactionsService.submit.mockResolvedValue({
        result: mockAccount,
        transactions: [mockTransaction],
      });

      const result = await service.applyAllIncomingAssetBalances(confidentialAccount, input);

      expect(result).toEqual({
        result: mockAccount,
        transactions: [mockTransaction],
      });
    });
  });
});
