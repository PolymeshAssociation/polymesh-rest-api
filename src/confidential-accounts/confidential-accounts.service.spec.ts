import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import { createMockConfidentialAccount, MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import { TransactionsService } from '~/transactions/transactions.service';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { signer } = testValues;

describe('ConfidentialAccountsService', () => {
  let service: ConfidentialAccountsService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;
  let mockTransactionsService: MockTransactionsService;
  const publicKey = 'SOME_PUBLIC_KEY';

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

      const result = await service.findOne(publicKey);

      expect(result).toEqual(account);
    });

    it('should call handleSdkError and throw an error', async () => {
      const mockError = new Error('Some Error');
      mockPolymeshApi.confidentialAccounts.getConfidentialAccount.mockRejectedValue(mockError);

      const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

      await expect(() => service.findOne(publicKey)).rejects.toThrowError();

      expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('fetchOwner', () => {
    it('should return the owner of Confidential Account', async () => {
      const account = createMockConfidentialAccount();

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(account);

      const result = await service.fetchOwner(publicKey);

      expect(result).toEqual(expect.objectContaining({ did: 'SOME_OWNER' }));
    });

    it('should throw an error if no owner exists', async () => {
      const account = createMockConfidentialAccount();
      account.getIdentity.mockResolvedValue(null);

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(account);

      await expect(service.fetchOwner(publicKey)).rejects.toThrow('No owner found');
    });
  });

  describe('createConfidentialAccount', () => {
    it('should create the Confidential Account', async () => {
      const input = {
        signer,
        publicKey,
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

      const result = await service.createConfidentialAccount(input);

      expect(result).toEqual({
        result: mockAccount,
        transactions: [mockTransaction],
      });
    });
  });
});
