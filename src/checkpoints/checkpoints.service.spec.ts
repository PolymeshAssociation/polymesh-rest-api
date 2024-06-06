/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CalendarUnit } from '~/common/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { testValues } from '~/test-utils/consts';
import {
  MockAsset,
  MockCheckpoint,
  MockCheckpointSchedule,
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

const { signer } = testValues;
const mockSchedules = [
  {
    schedule: {
      id: new BigNumber(1),
      period: {
        unit: CalendarUnit.Month,
        amount: new BigNumber(3),
      },
      start: new Date(),
      complexity: new BigNumber(4),
      expiryDate: null,
    },
    details: {
      remainingCheckpoints: new BigNumber(1),
      nextCheckpointDate: new Date(),
    },
  },
];

describe('CheckpointsService', () => {
  let service: CheckpointsService;
  let mockTransactionsService: MockTransactionsService;

  const mockAssetsService = new MockAssetService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckpointsService,
        AssetsService,
        mockPolymeshLoggerProvider,
        mockTransactionsProvider,
      ],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<CheckpointsService>(CheckpointsService);
    mockTransactionsService = mockTransactionsProvider.useValue;

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByTicker', () => {
    const mockCheckpoints = {
      data: [
        {
          checkpoint: {
            id: new BigNumber(1),
          },
          createdAt: new Date(),
          totalSupply: new BigNumber(10000),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };
    it('should return the list of Checkpoints created on an Asset', async () => {
      const mockAsset = new MockAsset();
      mockAsset.checkpoints.get.mockResolvedValue(mockCheckpoints);

      mockAssetsService.findFungible.mockResolvedValue(mockAsset);

      const result = await service.findAllByTicker('TICKER', new BigNumber(1));

      expect(result).toEqual(mockCheckpoints);
    });

    it('should return the list of Checkpoints created on an Asset from start key', async () => {
      const mockAsset = new MockAsset();
      mockAsset.checkpoints.get.mockResolvedValue(mockCheckpoints);

      mockAssetsService.findFungible.mockResolvedValue(mockAsset);

      const result = await service.findAllByTicker('TICKER', new BigNumber(1), 'START_KEY');

      expect(result).toEqual(mockCheckpoints);
    });
  });

  describe('findOne', () => {
    it('should return a checkpoint for a valid ticker and id', async () => {
      const mockAsset = new MockAsset();
      const mockCheckpoint = new MockCheckpoint();
      mockAsset.checkpoints.getOne.mockResolvedValue(mockCheckpoint);
      mockAssetsService.findFungible.mockResolvedValue(mockAsset);

      const result = await service.findOne('TICKER', new BigNumber(1));
      expect(result).toEqual(mockCheckpoint);
      expect(mockAssetsService.findFungible).toBeCalledWith('TICKER');
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        const mockAsset = new MockAsset();
        mockAsset.checkpoints.getOne.mockRejectedValue(mockError);
        mockAssetsService.findFungible.mockResolvedValue(mockAsset);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.findOne('TICKER', new BigNumber(1))).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('findSchedulesByTicker', () => {
    it('should return the list of active Checkpoint Schedules for an Asset', async () => {
      const mockAsset = new MockAsset();
      mockAsset.checkpoints.schedules.get.mockResolvedValue(mockSchedules);

      mockAssetsService.findFungible.mockResolvedValue(mockAsset);

      const result = await service.findSchedulesByTicker('TICKER');

      expect(result).toEqual(mockSchedules);
    });
  });

  describe('findScheduleById', () => {
    let mockAsset: MockAsset;
    const ticker = 'TICKER';
    const id = new BigNumber(1);

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findFungible.mockResolvedValue(mockAsset);
    });

    it('should return the Schedule for a valid ticker and id', async () => {
      const mockScheduleWithDetails = {
        schedule: new MockCheckpointSchedule(),
        details: {
          remainingCheckpoints: 1,
          nextCheckpointDate: new Date(),
        },
      };
      mockAsset.checkpoints.schedules.getOne.mockResolvedValue(mockScheduleWithDetails);

      const result = await service.findScheduleById(ticker, id);

      expect(result).toEqual(mockScheduleWithDetails);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockAsset.checkpoints.schedules.getOne.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.findScheduleById(ticker, id)).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });

    afterEach(() => {
      expect(mockAssetsService.findFungible).toHaveBeenCalledWith(ticker);
      expect(mockAsset.checkpoints.schedules.getOne).toHaveBeenCalledWith({
        id,
      });
    });
  });

  describe('createByTicker', () => {
    it('should create a Checkpoint and return the queue results', async () => {
      const mockCheckpoint = new MockCheckpoint();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.checkpoint.CreateCheckpoint,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({
        result: mockCheckpoint,
        transactions: [mockTransaction],
      });

      mockAssetsService.findFungible.mockReturnValue(mockAsset);

      const body = {
        signer,
      };

      const result = await service.createByTicker('TICKER', body);
      expect(result).toEqual({
        result: mockCheckpoint,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.checkpoints.create,
        {},
        expect.objectContaining({
          signer,
        })
      );
      expect(mockAssetsService.findFungible).toHaveBeenCalledWith('TICKER');
    });
  });

  describe('createScheduleByTicker', () => {
    it('should create a Checkpoint Schedule and return the queue results', async () => {
      const mockCheckpointSchedule = new MockCheckpointSchedule();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.checkpoint.CreateSchedule,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({
        result: mockCheckpointSchedule,
        transactions: [mockTransaction],
      });

      mockAssetsService.findFungible.mockReturnValue(mockAsset);

      const mockDate = new Date();
      const params = {
        signer,
        points: [mockDate],
      };

      const result = await service.createScheduleByTicker('TICKER', params);
      expect(result).toEqual({
        result: mockCheckpointSchedule,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.checkpoints.schedules.create,
        {
          points: [mockDate],
        },
        expect.objectContaining({
          signer,
        })
      );
      expect(mockAssetsService.findFungible).toHaveBeenCalledWith('TICKER');
    });
  });

  describe('getHolders', () => {
    const mockHolders = {
      data: [
        {
          identity: {
            did: '0x06000',
          },
          balance: new BigNumber(1000),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(1),
    };
    it('should return the list of Asset holders at a Checkpoint', async () => {
      const mockCheckpoint = new MockCheckpoint();
      mockCheckpoint.allBalances.mockResolvedValue(mockHolders);

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockCheckpoint as any);

      const result = await service.getHolders('TICKER', new BigNumber(1), new BigNumber(1));

      expect(result).toEqual(mockHolders);
      expect(mockCheckpoint.allBalances).toHaveBeenCalledWith({
        size: new BigNumber(1),
        start: undefined,
      });
    });

    it('should return the list of Asset holders at a Checkpoint from a start key', async () => {
      const mockCheckpoint = new MockCheckpoint();
      mockCheckpoint.allBalances.mockResolvedValue(mockHolders);
      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockCheckpoint as any);

      const result = await service.getHolders(
        'TICKER',
        new BigNumber(1),
        new BigNumber(10),
        'START_KEY'
      );

      expect(result).toEqual(mockHolders);
      expect(mockCheckpoint.allBalances).toHaveBeenCalledWith({
        start: 'START_KEY',
        size: new BigNumber(10),
      });
    });
  });

  describe('getAssetBalance', () => {
    it('should fetch the Asset balance for an Identity at a given Checkpoint', async () => {
      const id = new BigNumber(1);
      const balance = new BigNumber(10);
      const mockCheckpoint = new MockCheckpoint();
      const did = '0x6000';
      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockCheckpoint as any);
      mockCheckpoint.balance.mockResolvedValue(balance);

      const mockAsset = new MockAsset();
      mockAsset.checkpoints.getOne.mockResolvedValue(mockCheckpoint);

      mockAssetsService.findFungible.mockResolvedValue(mockAsset);

      const result = await service.getAssetBalance('TICKER', did, id);
      expect(result).toEqual({ balance, identity: did });
      expect(mockCheckpoint.balance).toHaveBeenCalledWith({ identity: did });
      expect(mockAssetsService.findFungible).toHaveBeenCalledWith('TICKER');
    });
  });

  describe('deleteScheduleByTicker', () => {
    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transaction = {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.checkpoint.RemoveSchedule,
        };
        const mockTransaction = new MockTransaction(transaction);

        const mockAsset = new MockAsset();
        mockTransactionsService.submit.mockResolvedValue({
          result: undefined,
          transactions: [mockTransaction],
        });

        mockAssetsService.findFungible.mockResolvedValue(mockAsset);
        const ticker = 'TICKER';
        const id = new BigNumber(1);

        const result = await service.deleteScheduleByTicker(ticker, id, { signer });
        expect(result).toEqual({
          result: undefined,
          transactions: [mockTransaction],
        });
        expect(mockTransactionsService.submit).toHaveBeenCalledWith(
          mockAsset.checkpoints.schedules.remove,
          {
            schedule: id,
          },
          expect.objectContaining({
            signer,
          })
        );
        expect(mockAssetsService.findFungible).toHaveBeenCalledWith(ticker);
      });
    });
  });

  describe('findCheckpointsByScheduleId', () => {
    let mockAsset: MockAsset;
    let mockCheckpoint: MockCheckpoint;
    const ticker = 'TICKER';
    const id = new BigNumber(1);
    const createdAt = new Date();
    const totalSupply = new BigNumber(1000);

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findFungible.mockResolvedValue(mockAsset);
      mockCheckpoint = new MockCheckpoint();

      mockCheckpoint.createdAt.mockResolvedValue(createdAt);
      mockCheckpoint.totalSupply.mockResolvedValue(totalSupply);
    });

    it('should return Checkpoints for a valid ticker and id', async () => {
      const mockSchedule = new MockCheckpointSchedule();
      mockSchedule.getCheckpoints.mockResolvedValue([mockCheckpoint]);

      const mockScheduleWithDetails = {
        schedule: mockSchedule,
        details: {
          remainingCheckpoints: 1,
          nextCheckpointDate: new Date(),
        },
      };
      mockAsset.checkpoints.schedules.getOne.mockResolvedValue(mockScheduleWithDetails);

      const result = await service.findCheckpointsByScheduleId(ticker, id);

      expect(result).toEqual([{ checkpoint: mockCheckpoint, createdAt, totalSupply }]);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockAsset.checkpoints.schedules.getOne.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.findCheckpointsByScheduleId(ticker, id)).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });

    afterEach(() => {
      expect(mockAssetsService.findFungible).toHaveBeenCalledWith(ticker);
      expect(mockAsset.checkpoints.schedules.getOne).toHaveBeenCalledWith({
        id,
      });
    });
  });

  describe('getComplexityForAsset', () => {
    it('should return a maxComplexity and schedules for a valid ticker', async () => {
      const maxComplexity = new BigNumber(1);
      const mockResult = {
        schedules: mockSchedules,
        maxComplexity,
      };

      const mockAsset = new MockAsset();
      mockAsset.checkpoints.schedules.get.mockResolvedValue(mockSchedules);
      mockAsset.checkpoints.schedules.maxComplexity.mockResolvedValue(maxComplexity);

      mockAssetsService.findFungible.mockResolvedValue(mockAsset);

      const result = await service.getComplexityForAsset('TICKER');
      expect(result).toEqual(mockResult);
      expect(mockAssetsService.findFungible).toBeCalledWith('TICKER');
    });
  });
});
