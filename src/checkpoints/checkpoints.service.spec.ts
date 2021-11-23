/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { CalendarUnit, ErrorCode, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockCheckpoint,
  MockCheckpointSchedule,
  MockSecurityToken,
  MockTransactionQueue,
} from '~/test-utils/mocks';
import { MockAssetService, MockRelayerAccountsService } from '~/test-utils/service-mocks';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('CheckpointsService', () => {
  let service: CheckpointsService;

  const mockAssetsService = new MockAssetService();

  const mockRelayerAccountsService = new MockRelayerAccountsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckpointsService,
        AssetsService,
        RelayerAccountsService,
        mockPolymeshLoggerProvider,
      ],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get<CheckpointsService>(CheckpointsService);
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
          totalSupply: new BigNumber('10000'),
        },
      ],
      next: '0xddddd',
      count: 2,
    };
    it('should return the list of Checkpoints created on an Asset', async () => {
      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.checkpoints.get.mockResolvedValue(mockCheckpoints);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findAllByTicker('TICKER', 1);

      expect(result).toEqual(mockCheckpoints);
    });

    it('should return the list of Checkpoints created on an Asset from start key', async () => {
      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.checkpoints.get.mockResolvedValue(mockCheckpoints);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findAllByTicker('TICKER', 1, 'START_KEY');

      expect(result).toEqual(mockCheckpoints);
    });
  });

  describe('findSchedulesByTicker', () => {
    it('should return the list of active Checkpoint Schedules for an Asset', async () => {
      const mockSchedules = [
        {
          schedule: {
            id: new BigNumber('1'),
            period: {
              unit: CalendarUnit.Month,
              amount: 3,
            },
            start: new Date(),
            complexity: 4,
            expiryDate: null,
          },
          details: {
            remainingCheckpoints: 1,
            nextCheckpointDate: new Date(),
          },
        },
      ];

      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.checkpoints.schedules.get.mockResolvedValue(mockSchedules);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findSchedulesByTicker('TICKER');

      expect(result).toEqual(mockSchedules);
    });
  });

  describe('findScheduleById', () => {
    let mockSecurityToken: MockSecurityToken;
    const ticker = 'TICKER';
    const id = new BigNumber(1);

    beforeEach(() => {
      mockSecurityToken = new MockSecurityToken();
      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);
    });

    describe('if the Schedule does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockSecurityToken.checkpoints.schedules.getOne.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.DataUnavailable,
            message: 'The Schedule does not exist',
          });
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
        mockSecurityToken.checkpoints.schedules.getOne.mockResolvedValue(mockScheduleWithDetails);

        const result = await service.findScheduleById(ticker, id);

        expect(result).toEqual(mockScheduleWithDetails);
      });
    });

    afterEach(() => {
      expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      expect(mockSecurityToken.checkpoints.schedules.getOne).toHaveBeenCalledWith({
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
          tag: TxTags.checkpoint.CreateCheckpoint,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockQueue.run.mockResolvedValue(mockCheckpoint);

      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.checkpoints.create.mockResolvedValue(mockQueue);

      mockAssetsService.findOne.mockReturnValue(mockSecurityToken);

      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
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
            transactionTag: TxTags.checkpoint.CreateCheckpoint,
          },
        ],
      });
      expect(mockSecurityToken.checkpoints.create).toHaveBeenCalledWith(undefined, {
        signer: address,
      });
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
          tag: TxTags.checkpoint.CreateSchedule,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockQueue.run.mockResolvedValue(mockCheckpointSchedule);

      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.checkpoints.schedules.create.mockResolvedValue(mockQueue);

      mockAssetsService.findOne.mockReturnValue(mockSecurityToken);

      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
      const mockDate = new Date();
      const params = {
        signer: 'signer',
        start: mockDate,
        period: { unit: CalendarUnit.Month, amount: 3 },
        repetitions: 2,
      };

      const result = await service.createScheduleByTicker('TICKER', params);
      expect(result).toEqual({
        result: mockCheckpointSchedule,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.checkpoint.CreateSchedule,
          },
        ],
      });
      expect(mockSecurityToken.checkpoints.schedules.create).toHaveBeenCalledWith(
        {
          start: mockDate,
          period: { unit: CalendarUnit.Month, amount: 3 },
          repetitions: 2,
        },
        {
          signer: address,
        }
      );
      expect(mockAssetsService.findOne).toHaveBeenCalledWith('TICKER');
    });
  });
});
