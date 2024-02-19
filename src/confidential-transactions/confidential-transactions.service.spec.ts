import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import {
  createMockConfidentialTransaction,
  createMockConfidentialVenue,
  MockPolymesh,
  MockTransaction,
} from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import { TransactionsService } from '~/transactions/transactions.service';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { signer } = testValues;

describe('ConfidentialTransactionsService', () => {
  let service: ConfidentialTransactionsService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;
  let mockTransactionsService: MockTransactionsService;
  const id = new BigNumber(1);

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [ConfidentialTransactionsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    mockPolymeshApi = module.get<MockPolymesh>(POLYMESH_API);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockTransactionsService = module.get<MockTransactionsService>(TransactionsService);

    service = module.get<ConfidentialTransactionsService>(ConfidentialTransactionsService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a Confidential Transaction for a valid ID', async () => {
      const transaction = createMockConfidentialTransaction();
      mockPolymeshApi.confidentialSettlements.getTransaction.mockResolvedValue(transaction);

      const result = await service.findOne(id);

      expect(result).toEqual(transaction);
    });

    it('should call handleSdkError and throw an error', async () => {
      const mockError = new Error('Some Error');
      mockPolymeshApi.confidentialSettlements.getTransaction.mockRejectedValue(mockError);

      const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

      await expect(() => service.findOne(id)).rejects.toThrowError();

      expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('findVenue', () => {
    it('should return a Confidential Venue for a valid ID', async () => {
      const venue = createMockConfidentialVenue();
      mockPolymeshApi.confidentialSettlements.getVenue.mockResolvedValue(venue);

      const result = await service.findVenue(id);

      expect(result).toEqual(venue);
    });

    it('should call handleSdkError and throw an error', async () => {
      const mockError = new Error('Some Error');
      mockPolymeshApi.confidentialSettlements.getVenue.mockRejectedValue(mockError);

      const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

      await expect(() => service.findVenue(id)).rejects.toThrowError();

      expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getVenueCreator', () => {
    it('should return the creator of the Venue', async () => {
      const venue = createMockConfidentialVenue();

      jest.spyOn(service, 'findVenue').mockResolvedValue(venue);

      const result = await service.getVenueCreator(id);

      expect(result).toEqual(expect.objectContaining({ did: 'SOME_OWNER' }));
    });
  });

  describe('createConfidentialVenue', () => {
    it('should create the Confidential Venue', async () => {
      const input = {
        signer,
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.confidentialAsset.CreateVenue,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockVenue = createMockConfidentialVenue();

      mockTransactionsService.submit.mockResolvedValue({
        result: mockVenue,
        transactions: [mockTransaction],
      });

      const result = await service.createConfidentialVenue(input);

      expect(result).toEqual({
        result: mockVenue,
        transactions: [mockTransaction],
      });
    });
  });
});
