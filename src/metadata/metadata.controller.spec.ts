import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  MetadataEntry,
  MetadataLockStatus,
  MetadataType,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { TransactionType } from '~/common/types';
import { CreateMetadataDto } from '~/metadata/dto/create-metadata.dto';
import { SetMetadataDto } from '~/metadata/dto/set-metadata.dto';
import { MetadataController } from '~/metadata/metadata.controller';
import { MetadataService } from '~/metadata/metadata.service';
import { MetadataDetailsModel } from '~/metadata/models/metadata-details.model';
import { MetadataEntryModel } from '~/metadata/models/metadata-entry.model';
import { MetadataValueModel } from '~/metadata/models/metadata-value.model';
import { testValues } from '~/test-utils/consts';
import { createMockMetadataEntry, createMockTransactionResult } from '~/test-utils/mocks';
import { mockMetadataServiceProvider } from '~/test-utils/service-mocks';

const { assetId } = testValues;

describe('MetadataController', () => {
  const { txResult } = testValues;
  let controller: MetadataController;
  let mockService: DeepMocked<MetadataService>;
  let type: MetadataType;
  let id: BigNumber;

  beforeEach(async () => {
    type = MetadataType.Local;
    id = new BigNumber(1);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetadataController],
      providers: [mockMetadataServiceProvider],
    }).compile();

    mockService = mockMetadataServiceProvider.useValue as DeepMocked<MetadataService>;

    controller = module.get<MetadataController>(MetadataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetadata', () => {
    it('should return the list of all metadata for a given ticker', async () => {
      const mockMetadataEntry = createMockMetadataEntry();
      when(mockService.findAll).calledWith(assetId).mockResolvedValue([mockMetadataEntry]);

      const result = await controller.getMetadata({ asset: assetId });

      expect(result).toEqual({
        results: [new MetadataEntryModel({ asset: assetId, type, id })],
      });
    });
  });

  describe('getSingleMetadata', () => {
    it('should return the Metadata details for a specific type and ID', async () => {
      const mockMetadataEntry = createMockMetadataEntry();
      const mockDetails = {
        name: 'Some metadata',
        specs: {
          description: 'Some description',
        },
      };

      const mockValue = {
        value: 'Some Value',
        expiry: new Date('2099/01/01'),
        lockStatus: MetadataLockStatus.LockedUntil,
        lockedUntil: new Date('2030/01/01'),
      };

      mockMetadataEntry.details.mockResolvedValue(mockDetails);
      mockMetadataEntry.value.mockResolvedValue(mockValue);

      when(mockService.findOne)
        .calledWith({ asset: assetId, type, id })
        .mockResolvedValue(mockMetadataEntry);

      const result = await controller.getSingleMetadata({ asset: assetId, type, id });

      expect(result).toEqual(
        new MetadataDetailsModel({
          asset: assetId,
          type,
          id,
          ...mockDetails,
          value: new MetadataValueModel(mockValue),
        })
      );
    });
  });

  describe('createMetadata', () => {
    it('should accept CreateMetadataDto and create a local Asset Metadata for the given ticker', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.asset.RegisterAssetMetadataLocalType,
      };
      const mockMetadataEntry = createMockMetadataEntry();
      const testTxResult = createMockTransactionResult<MetadataEntry>({
        ...txResult,
        transactions: [transaction],
        result: mockMetadataEntry,
      });
      const mockPayload: CreateMetadataDto = {
        name: 'Some Metadata',
        specs: {
          description: 'Some description',
        },
        signer: 'Alice',
      };

      when(mockService.create).calledWith(assetId, mockPayload).mockResolvedValue(testTxResult);

      const result = await controller.createMetadata({ asset: assetId }, mockPayload);

      expect(result).toEqual(
        expect.objectContaining({
          transactions: [transaction],
          metadata: new MetadataEntryModel({ asset: assetId, type, id }),
        })
      );
    });
  });

  describe('setMetadata', () => {
    it('should accept SetMetadataDto and set the value of the Asset Metadata', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.asset.RegisterAssetMetadataLocalType,
      };
      const testTxResult = createMockTransactionResult<MetadataEntry>({
        ...txResult,
        transactions: [transaction],
      });
      const mockPayload: SetMetadataDto = {
        value: 'some value',
        signer: 'Alice',
      };

      when(mockService.setValue)
        .calledWith({ asset: assetId, type, id }, mockPayload)
        .mockResolvedValue(testTxResult);

      const result = await controller.setMetadata({ asset: assetId, type, id }, mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });

  describe('clearMetadata', () => {
    it('should remove the value of the Asset Metadata', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.asset.RemoveMetadataValue,
      };
      const testTxResult = createMockTransactionResult<void>({
        ...txResult,
        transactions: [transaction],
      });
      const mockBody = {
        signer: 'Alice',
      };

      when(mockService.clearValue)
        .calledWith({ asset: assetId, type, id }, mockBody)
        .mockResolvedValue(testTxResult);

      const result = await controller.clearMetadata({ asset: assetId, type, id }, mockBody);

      expect(result).toEqual(testTxResult);
    });
  });

  describe('removeKey', () => {
    it('should remove an Asset Metadata', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.asset.RemoveLocalMetadataKey,
      };
      const mockBody = {
        signer: 'Alice',
      };

      const testTxResult = createMockTransactionResult<void>({
        ...txResult,
        transactions: [transaction],
      });

      when(mockService.removeKey)
        .calledWith({ asset: assetId, type, id }, mockBody)
        .mockResolvedValue(testTxResult);

      const result = await controller.removeLocalMetadata({ asset: assetId, type, id }, mockBody);

      expect(result).toEqual(testTxResult);
    });
  });
});
