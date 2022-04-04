/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { CalendarUnit, ErrorCode, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { TransactionType } from '~/common/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { mockSigningProvider } from '~/signing/signing.mock';
import {
  MockAsset,
  MockCheckpoint,
  MockCheckpointSchedule,
  MockTransactionQueue,
} from '~/test-utils/mocks';
import { MockAssetService } from '~/test-utils/service-mocks';
import { ErrorCase } from '~/test-utils/types';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('CheckpointsService', () => {
  let service: CheckpointsService;

  const mockAssetsService = new MockAssetService();

  const mockSigningService = mockSigningProvider.useValue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckpointsService,
        AssetsService,
        mockPolymeshLoggerProvider,
        mockSigningProvider,
      ],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<CheckpointsService>(CheckpointsService);

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

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findAllByTicker('TICKER', new BigNumber(1));

      expect(result).toEqual(mockCheckpoints);
    });

    it('should return the list of Checkpoints created on an Asset from start key', async () => {
      const mockAsset = new MockAsset();
      mockAsset.checkpoints.get.mockResolvedValue(mockCheckpoints);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findAllByTicker('TICKER', new BigNumber(1), 'START_KEY');

      expect(result).toEqual(mockCheckpoints);
    });
  });

  describe('findOne', () => {
    it('should return NotFoundException if the asset does not exist', async () => {
      mockAssetsService.findOne.mockImplementation(() => {
        throw new NotFoundException('Asset does not exist');
      });

      let error;
      try {
        await service.findOne('TICKER', new BigNumber(1));
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(NotFoundException);
    });

    it('should return NotFoundException if the checkpoint does not exist', async () => {
      mockIsPolymeshError.mockReturnValue(true);
      const mockAsset = new MockAsset();
      const mockError = {
        code: ErrorCode.DataUnavailable,
        message: 'The checkpoint was not found',
      };
      mockAsset.checkpoints.getOne.mockImplementation(() => {
        throw mockError;
      });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      let error;
      try {
        await service.findOne('TICKER', new BigNumber(1));
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(NotFoundException);
    });

    it('should return a checkpoint given a ticker and id', async () => {
      const mockAsset = new MockAsset();
      const mockCheckpoint = new MockCheckpoint();
      mockAsset.checkpoints.getOne.mockResolvedValue(mockCheckpoint);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findOne('TICKER', new BigNumber(1));
      expect(result).toEqual(mockCheckpoint);
      expect(mockAssetsService.findOne).toBeCalledWith('TICKER');
    });
  });

  describe('findSchedulesByTicker', () => {
    it('should return the list of active Checkpoint Schedules for an Asset', async () => {
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

      const mockAsset = new MockAsset();
      mockAsset.checkpoints.schedules.get.mockResolvedValue(mockSchedules);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

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
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
    });

    describe('if the Schedule does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Schedule does not exist',
        };
        mockAsset.checkpoints.schedules.getOne.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findScheduleById(ticker, id);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
        mockIsPolymeshError.mockReset();
      });
    });

    describe('otherwise', () => {
      it('should return the Schedule', async () => {
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
    });

    afterEach(() => {
      expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      expect(mockAsset.checkpoints.schedules.getOne).toHaveBeenCalledWith({
        id,
      });
    });
  });

  describe('createByTicker', () => {
    it('should create a Checkpoint and return the queue results', async () => {
      const mockCheckpoint = new MockCheckpoint();
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.checkpoint.CreateCheckpoint,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockQueue.run.mockResolvedValue(mockCheckpoint);

      const mockAsset = new MockAsset();
      mockAsset.checkpoints.create.mockResolvedValue(mockQueue);

      mockAssetsService.findOne.mockReturnValue(mockAsset);

      const address = 'address';
      mockSigningService.getAddressByHandle.mockReturnValue(address);
      const body = {
        signer: 'signer',
      };

      const result = await service.createByTicker('TICKER', body);
      expect(result).toEqual({
        result: mockCheckpoint,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            blockNumber: new BigNumber(1),
            transactionTag: TxTags.checkpoint.CreateCheckpoint,
            type: TransactionType.Single,
          },
        ],
      });
      expect(mockAsset.checkpoints.create).toHaveBeenCalledWith(
        {
          signingAccount: address,
        },
        {}
      );
      expect(mockAssetsService.findOne).toHaveBeenCalledWith('TICKER');
    });
  });

  describe('createScheduleByTicker', () => {
    it('should create a Checkpoint Schedule and return the queue results', async () => {
      const mockCheckpointSchedule = new MockCheckpointSchedule();
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.checkpoint.CreateSchedule,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockQueue.run.mockResolvedValue(mockCheckpointSchedule);

      const mockAsset = new MockAsset();
      mockAsset.checkpoints.schedules.create.mockResolvedValue(mockQueue);

      mockAssetsService.findOne.mockReturnValue(mockAsset);

      const address = 'address';
      mockSigningService.getAddressByHandle.mockReturnValue(address);
      const mockDate = new Date();
      const params = {
        signer: 'signer',
        start: mockDate,
        period: { unit: CalendarUnit.Month, amount: new BigNumber(3) },
        repetitions: new BigNumber(2),
      };

      const result = await service.createScheduleByTicker('TICKER', params);
      expect(result).toEqual({
        result: mockCheckpointSchedule,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            blockNumber: new BigNumber(1),
            transactionTag: TxTags.checkpoint.CreateSchedule,
            type: TransactionType.Single,
          },
        ],
      });
      expect(mockAsset.checkpoints.schedules.create).toHaveBeenCalledWith(
        {
          start: mockDate,
          period: { unit: CalendarUnit.Month, amount: new BigNumber(3) },
          repetitions: new BigNumber(2),
        },
        {
          signingAccount: address,
        }
      );
      expect(mockAssetsService.findOne).toHaveBeenCalledWith('TICKER');
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
      findOneSpy.mockRestore();
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
      findOneSpy.mockRestore();
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

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.getAssetBalance('TICKER', did, id);
      expect(result).toEqual({ balance, identity: did });
      expect(mockCheckpoint.balance).toHaveBeenCalledWith({ identity: did });
      expect(mockAssetsService.findOne).toHaveBeenCalledWith('TICKER');

      findOneSpy.mockRestore();
    });
  });

  describe('deleteScheduleByTicker', () => {
    describe('if there is a error', () => {
      const cases: ErrorCase[] = [
        [
          'Schedule does not exist',
          {
            code: ErrorCode.ValidationError,
            message: 'Schedule no longer exists. It was either removed or it expired',
          },
          BadRequestException,
        ],
        [
          'Schedule cannot be removed',
          {
            code: ErrorCode.ValidationError,
            message: 'You cannot remove this Schedule',
          },
          BadRequestException,
        ],
      ];
      test.each(cases)('%s', async (_, polymeshError, HttpException) => {
        const signer = '0x6'.padEnd(66, '0');

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const mockAsset = new MockAsset();
        mockAsset.checkpoints.schedules.remove.mockImplementation(() => {
          throw polymeshError;
        });
        mockAssetsService.findOne.mockReturnValue(mockAsset);
        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.deleteScheduleByTicker('TICKER', new BigNumber(1), signer);
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(HttpException);

        mockIsPolymeshError.mockReset();
      });
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.checkpoint.RemoveSchedule,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);

        const mockAsset = new MockAsset();
        mockAsset.checkpoints.schedules.remove.mockResolvedValue(mockQueue);

        mockAssetsService.findOne.mockResolvedValue(mockAsset);

        const signer = '0x6'.padEnd(66, '0');
        const ticker = 'TICKER';
        const id = new BigNumber(1);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.deleteScheduleByTicker(ticker, id, signer);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.checkpoint.RemoveSchedule,
              type: TransactionType.Single,
            },
          ],
        });
        expect(mockAsset.checkpoints.schedules.remove).toHaveBeenCalledWith(
          {
            schedule: id,
          },
          {
            signingAccount: address,
          }
        );
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
  });
});
