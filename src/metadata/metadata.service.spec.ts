/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { MetadataLockStatus, MetadataType, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AssetsService } from '~/assets/assets.service';
import { MetadataService } from '~/metadata/metadata.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import {
  createMockMetadataEntry,
  MockAsset,
  MockPolymesh,
  MockTransaction,
} from '~/test-utils/mocks';
import {
  MockAssetService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';
import * as transactionsUtilModule from '~/transactions/transactions.util';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('MetadataService', () => {
  let service: MetadataService;
  let mockAssetsService: MockAssetService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;
  let ticker: string;
  let type: MetadataType;
  let id: BigNumber;
  let signer: string;

  beforeEach(async () => {
    ticker = 'TICKER';
    type = MetadataType.Local;
    id = new BigNumber(1);
    signer = testValues.signer;
    mockPolymeshApi = new MockPolymesh();

    mockTransactionsService = mockTransactionsProvider.useValue;
    mockAssetsService = new MockAssetService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [MetadataService, AssetsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<MetadataService>(MetadataService);
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

  describe('findGlobalKeys', () => {
    it('should return a list of global metadata keys', async () => {
      const globalKeys = [
        {
          name: 'Global Metadata',
          id: new BigNumber(1),
          specs: { description: 'Some description' },
        },
      ];

      mockPolymeshApi.assets.getGlobalMetadataKeys.mockResolvedValue(globalKeys);

      const result = await service.findGlobalKeys();

      expect(result).toEqual(globalKeys);
    });
  });

  describe('findAll', () => {
    it('should return all Metadata entries for a given ticker', async () => {
      const metadata = [createMockMetadataEntry()];
      const mockAsset = new MockAsset();
      mockAsset.metadata.get.mockResolvedValue(metadata);

      when(mockAssetsService.findOne).calledWith(ticker).mockResolvedValue(mockAsset);

      const result = await service.findAll(ticker);

      expect(result).toEqual(metadata);
    });
  });

  describe('findOne', () => {
    let mockAsset: MockAsset;

    beforeEach(() => {
      mockAsset = new MockAsset();
      when(mockAssetsService.findOne).calledWith(ticker).mockResolvedValue(mockAsset);
    });

    it('should return the Metadata entry', async () => {
      const mockMetadataEntry = createMockMetadataEntry();
      mockAsset.metadata.getOne.mockResolvedValue(mockMetadataEntry);

      const result = await service.findOne({ asset: ticker, type, id });

      expect(result).toEqual(mockMetadataEntry);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockAsset.metadata.getOne.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(service.findOne({ asset: ticker, type, id })).rejects.toThrow();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('create', () => {
    it('should run a register procedure and return the queue results', async () => {
      const mockMetadataEntry = createMockMetadataEntry();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.RegisterAssetMetadataLocalType,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const mockAsset = new MockAsset();
      when(mockAssetsService.findOne).calledWith(ticker).mockResolvedValue(mockAsset);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockMetadataEntry,
        transactions: [mockTransaction],
      });

      const body = {
        signer,
        name: 'Some Metadata',
        specs: {
          description: 'Some description',
        },
      };

      const result = await service.create(ticker, body);
      expect(result).toEqual({
        result: mockMetadataEntry,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.metadata.register,
        { name: body.name, specs: body.specs },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('setValue', () => {
    it('should run a set procedure and return the queue results', async () => {
      const mockMetadataEntry = createMockMetadataEntry();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.SetAssetMetadata,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const findOneSpy = jest.spyOn(service, 'findOne');
      when(findOneSpy)
        .calledWith({ asset: ticker, type, id })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockMetadataEntry as any);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockMetadataEntry,
        transactions: [mockTransaction],
      });

      const body = {
        signer,
        value: 'some value',
        details: {
          expiry: new Date('2099/01/01'),
          lockStatus: MetadataLockStatus.Locked,
        },
      };

      const result = await service.setValue({ asset: ticker, type, id }, body);
      expect(result).toEqual({
        result: mockMetadataEntry,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockMetadataEntry.set,
        { value: body.value, details: body.details },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('clearValue', () => {
    it('should run a set procedure and return the queue results', async () => {
      const mockMetadataEntry = createMockMetadataEntry();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.RemoveMetadataValue,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const findOneSpy = jest.spyOn(service, 'findOne');
      when(findOneSpy)
        .calledWith({ asset: ticker, type, id })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockMetadataEntry as any);

      mockTransactionsService.submit.mockResolvedValue({
        transactions: [mockTransaction],
      });

      const body = {
        signer,
      };

      const result = await service.clearValue({ asset: ticker, type, id }, body);
      expect(result).toEqual({
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockMetadataEntry.clear,
        undefined,
        expect.objectContaining({ signer })
      );
    });
  });

  describe('removeKey', () => {
    it('should run a set procedure and return the queue results', async () => {
      const mockMetadataEntry = createMockMetadataEntry();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.RemoveLocalMetadataKey,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const findOneSpy = jest.spyOn(service, 'findOne');
      when(findOneSpy)
        .calledWith({ asset: ticker, type, id })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockMetadataEntry as any);

      mockTransactionsService.submit.mockResolvedValue({
        transactions: [mockTransaction],
      });

      const body = {
        signer,
      };

      const result = await service.removeKey({ asset: ticker, type, id }, body);
      expect(result).toEqual({
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockMetadataEntry.remove,
        undefined,
        expect.objectContaining({ signer })
      );
    });
  });
});
