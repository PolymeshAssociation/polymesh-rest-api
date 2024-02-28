import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ConfidentialVenueFilteringDetails, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { ConfidentialAssetsService } from '~/confidential-assets/confidential-assets.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import { createMockConfidentialAsset, MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import { TransactionsService } from '~/transactions/transactions.service';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { signer } = testValues;

describe('ConfidentialAssetsService', () => {
  let service: ConfidentialAssetsService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;
  let mockTransactionsService: MockTransactionsService;
  const id = 'SOME-CONFIDENTIAL-ASSET-ID';

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [ConfidentialAssetsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    mockPolymeshApi = module.get<MockPolymesh>(POLYMESH_API);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockTransactionsService = module.get<MockTransactionsService>(TransactionsService);

    service = module.get<ConfidentialAssetsService>(ConfidentialAssetsService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a Confidential Asset for a valid ID', async () => {
      const asset = createMockConfidentialAsset();
      mockPolymeshApi.confidentialAssets.getConfidentialAsset.mockResolvedValue(asset);

      const result = await service.findOne(id);

      expect(result).toEqual(asset);
    });

    it('should call handleSdkError and throw an error', async () => {
      const mockError = new Error('Some Error');
      mockPolymeshApi.confidentialAssets.getConfidentialAsset.mockRejectedValue(mockError);

      const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

      await expect(() => service.findOne(id)).rejects.toThrowError();

      expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('createConfidentialAsset', () => {
    it('should create the Confidential Asset', async () => {
      const input = {
        signer,
        data: 'SOME_DATA',
        auditors: ['AUDITOR_KEY'],
        mediators: ['MEDIATOR_DID'],
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.confidentialAsset.CreateConfidentialAsset,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockAsset = createMockConfidentialAsset();

      mockTransactionsService.submit.mockResolvedValue({
        result: mockAsset,
        transactions: [mockTransaction],
      });

      const result = await service.createConfidentialAsset(input);

      expect(result).toEqual({
        result: mockAsset,
        transactions: [mockTransaction],
      });
    });
  });

  describe('issue', () => {
    it('should mint Confidential Assets', async () => {
      const input = {
        signer,
        amount: new BigNumber(100),
        confidentialAccount: 'SOME_ACCOUNT',
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.confidentialAsset.MintConfidentialAsset,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockAsset = createMockConfidentialAsset();

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockAsset);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockAsset,
        transactions: [mockTransaction],
      });

      const result = await service.issue(id, input);

      expect(result).toEqual({
        result: mockAsset,
        transactions: [mockTransaction],
      });
    });
  });

  describe('fetchOwner', () => {
    it('should return the owner of Confidential Account', async () => {
      const asset = createMockConfidentialAsset();
      const expectedResult: ConfidentialVenueFilteringDetails = {
        enabled: false,
      };
      asset.getVenueFilteringDetails.mockResolvedValue(expectedResult);

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(asset);

      const result = await service.getVenueFilteringDetails(id);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('setVenueFiltering', () => {
    it('should call the setVenueFiltering procedure and return the results', async () => {
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.confidentialAsset.SetVenueFiltering,
      };

      const mockTransaction = new MockTransaction(mockTransactions);
      const mockAsset = createMockConfidentialAsset();

      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsset);

      mockTransactionsService.submit.mockResolvedValue({
        transactions: [mockTransaction],
      });

      let result = await service.setVenueFilteringDetails(id, { signer, enabled: true });

      expect(result).toEqual({
        transactions: [mockTransaction],
      });

      result = await service.setVenueFilteringDetails(id, {
        signer,
        allowedVenues: [new BigNumber(1)],
      });

      expect(result).toEqual({
        transactions: [mockTransaction],
      });

      result = await service.setVenueFilteringDetails(id, {
        signer,
        disallowedVenues: [new BigNumber(2)],
      });

      expect(result).toEqual({
        transactions: [mockTransaction],
      });
    });
  });
});
