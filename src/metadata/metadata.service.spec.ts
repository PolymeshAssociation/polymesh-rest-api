/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ErrorCode,
  MetadataLockStatus,
  MetadataType,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AssetsService } from '~/assets/assets.service';
import { MetadataService } from '~/metadata/metadata.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockAsset, MockMetadataEntry, MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import {
  MockAssetService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
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

  beforeEach(async () => {
    ticker = 'TICKER';
    type = MetadataType.Local;
    id = new BigNumber(1);
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
      const metadata = [new MockMetadataEntry()];
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
      mockIsPolymeshError.mockReturnValue(false);
      mockAsset = new MockAsset();
      when(mockAssetsService.findOne).calledWith(ticker).mockResolvedValue(mockAsset);
    });

    afterAll(() => {
      mockIsPolymeshError.mockReset();
    });

    describe('if the Metadata does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'There is no Metadata with given type and id',
        };
        mockAsset.metadata.getOne.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne({ ticker, type, id });
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        let expectedError = new Error('foo');
        mockAsset.metadata.getOne.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          await service.findOne({ ticker, type, id });
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          await service.findOne({ ticker, type, id });
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return the Asset', async () => {
        const mockMetadataEntry = new MockMetadataEntry();
        mockAsset.metadata.getOne.mockReturnValue(mockMetadataEntry);

        const result = await service.findOne({ ticker, type, id });

        expect(result).toEqual(mockMetadataEntry);
      });
    });
  });

  describe('create', () => {
    it('should run a register procedure and return the queue results', async () => {
      const mockMetadataEntry = new MockMetadataEntry();
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

      const signer = 'signer';
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
        { signer }
      );
    });
  });

  describe('setValue', () => {
    it('should run a set procedure and return the queue results', async () => {
      const mockMetadataEntry = new MockMetadataEntry();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.SetAssetMetadata,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const findOneSpy = jest.spyOn(service, 'findOne');
      when(findOneSpy)
        .calledWith({ ticker, type, id })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockMetadataEntry as any);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockMetadataEntry,
        transactions: [mockTransaction],
      });

      const signer = 'signer';
      const body = {
        signer,
        value: 'some value',
        details: {
          expiry: new Date('2099/01/01'),
          lockStatus: MetadataLockStatus.Locked,
        },
      };

      const result = await service.setValue({ ticker, type, id }, body);
      expect(result).toEqual({
        result: mockMetadataEntry,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockMetadataEntry.set,
        { value: body.value, details: body.details },
        { signer }
      );
      findOneSpy.mockRestore();
    });
  });
});
