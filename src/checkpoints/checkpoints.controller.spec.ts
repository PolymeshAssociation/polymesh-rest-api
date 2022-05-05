import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';

import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { CheckpointsController } from '~/checkpoints/checkpoints.controller';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CheckpointDetailsModel } from '~/checkpoints/models/checkpoint-details.model';
import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { MockCheckpoint, MockCheckpointSchedule } from '~/test-utils/mocks';
import { MockCheckpointsService } from '~/test-utils/service-mocks';

describe('CheckpointsController', () => {
  let controller: CheckpointsController;

  const mockCheckpointsService = new MockCheckpointsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckpointsController],
      providers: [CheckpointsService],
    })
      .overrideProvider(CheckpointsService)
      .useValue(mockCheckpointsService)
      .compile();

    controller = module.get<CheckpointsController>(CheckpointsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCheckpoint', () => {
    it('should return the Checkpoint data', async () => {
      const createdAt = new Date();
      const totalSupply = new BigNumber(1000);
      const id = new BigNumber(1);
      const ticker = 'TICKER';

      const mockCheckpoint = new MockCheckpoint();
      mockCheckpoint.createdAt.mockResolvedValue(createdAt);
      mockCheckpoint.totalSupply.mockResolvedValue(totalSupply);
      mockCheckpointsService.findOne.mockResolvedValue(mockCheckpoint);

      const result = await controller.getCheckpoint({ ticker, id });
      expect(result).toEqual(new CheckpointDetailsModel({ id, totalSupply, createdAt }));
    });
  });

  describe('getCheckpoints', () => {
    const mockDate = new Date();
    const mockCheckpoints = {
      data: [
        {
          checkpoint: {
            id: new BigNumber(1),
          },
          createdAt: mockDate,
          totalSupply: new BigNumber(10000),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    const mockResult = new PaginatedResultsModel({
      results: [
        {
          id: new BigNumber(1),
          createdAt: mockDate,
          totalSupply: new BigNumber(10000),
        },
      ],
      total: new BigNumber(2),
      next: '0xddddd',
    });
    it('should return the list of Checkpoints created on an Asset', async () => {
      mockCheckpointsService.findAllByTicker.mockResolvedValue(mockCheckpoints);

      const result = await controller.getCheckpoints(
        { ticker: 'TICKER' },
        { size: new BigNumber(1) }
      );

      expect(result).toEqual(mockResult);
    });

    it('should return the list of Checkpoints created on an Asset from start key', async () => {
      mockCheckpointsService.findAllByTicker.mockResolvedValue(mockCheckpoints);

      const result = await controller.getCheckpoints(
        { ticker: 'TICKER' },
        { size: new BigNumber(1), start: 'START_KEY' }
      );

      expect(result).toEqual(mockResult);
    });
  });

  describe('createCheckpoint', () => {
    it('should return the details of newly created Checkpoint', async () => {
      const mockCheckpoint = new MockCheckpoint();
      const response = {
        result: mockCheckpoint,
        transactions: ['transaction'],
      };
      mockCheckpointsService.createByTicker.mockResolvedValue(response);
      const body = {
        signer: 'signer',
      };

      const result = await controller.createCheckpoint({ ticker: 'TICKER' }, body);

      expect(result).toEqual({
        checkpoint: mockCheckpoint,
        transactions: ['transaction'],
      });
    });
  });

  describe('getSchedules', () => {
    it('should return the list of active Checkpoint Schedules for an Asset', async () => {
      const mockDate = new Date();
      const mockSchedules = [
        {
          schedule: {
            id: new BigNumber(1),
            period: {
              unit: CalendarUnit.Month,
              amount: new BigNumber(3),
            },
            start: mockDate,
            complexity: new BigNumber(4),
            expiryDate: null,
          },
          details: {
            remainingCheckpoints: new BigNumber(1),
            nextCheckpointDate: mockDate,
          },
        },
      ];

      mockCheckpointsService.findSchedulesByTicker.mockResolvedValue(mockSchedules);

      const result = await controller.getSchedules({ ticker: 'TICKER' });

      const mockResult = [
        {
          id: new BigNumber(1),
          ticker: 'TICKER',
          period: {
            unit: CalendarUnit.Month,
            amount: new BigNumber(3),
          },
          start: mockDate,
          complexity: new BigNumber(4),
          expiryDate: null,
          remainingCheckpoints: new BigNumber(1),
          nextCheckpointDate: mockDate,
        },
      ];

      expect(result).toEqual(new ResultsModel({ results: mockResult }));
    });
  });

  describe('getSchedule', () => {
    it('should call the service and return the Checkpoint Schedule details', async () => {
      const mockDate = new Date();
      const mockScheduleWithDetails = {
        schedule: new MockCheckpointSchedule(),
        details: {
          remainingCheckpoints: new BigNumber(1),
          nextCheckpointDate: mockDate,
        },
      };
      mockCheckpointsService.findScheduleById.mockResolvedValue(mockScheduleWithDetails);

      const result = await controller.getSchedule({ ticker: 'TICKER', id: new BigNumber(1) });

      const mockResult = new CheckpointScheduleModel({
        ...mockScheduleWithDetails.schedule,
        ...mockScheduleWithDetails.details,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('createSchedule', () => {
    it('should return the details of newly created Checkpoint Schedule', async () => {
      const mockDate = new Date();

      const mockCheckpointSchedule = new MockCheckpointSchedule();
      const response = {
        result: mockCheckpointSchedule,
        transactions: ['transaction'],
      };
      mockCheckpointsService.createScheduleByTicker.mockResolvedValue(response);

      const mockScheduleWithDetails = {
        schedule: new MockCheckpointSchedule(),
        details: {
          remainingCheckpoints: new BigNumber(1),
          nextCheckpointDate: mockDate,
        },
      };
      mockCheckpointsService.findScheduleById.mockResolvedValue(mockScheduleWithDetails);

      const body = {
        signer: 'signer',
        start: mockDate,
        period: { unit: CalendarUnit.Month, amount: new BigNumber(3) },
        repetitions: new BigNumber(2),
      };

      const result = await controller.createSchedule({ ticker: 'TICKER' }, body);

      const mockCreatedSchedule = new CheckpointScheduleModel({
        ...mockScheduleWithDetails.schedule,
        ...mockScheduleWithDetails.details,
      });
      expect(result).toEqual({
        schedule: mockCreatedSchedule,
        transactions: ['transaction'],
      });
    });
  });

  describe('getHolders', () => {
    const mockAssetHolders = {
      data: [
        {
          identity: { did: '0xe2dd3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2' },
          balance: new BigNumber(627880),
        },
        {
          identity: { did: '0x666d3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2' },
          balance: new BigNumber(1000),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    const mockResult = new PaginatedResultsModel({
      results: [
        new IdentityBalanceModel({
          identity: '0xe2dd3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2',
          balance: new BigNumber(627880),
        }),
        new IdentityBalanceModel({
          identity: '0x666d3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2',
          balance: new BigNumber(1000),
        }),
      ],
      total: new BigNumber(2),
      next: '0xddddd',
    });
    it('should return the holders of an Asset at a given Checkpoint', async () => {
      mockCheckpointsService.getHolders.mockResolvedValue(mockAssetHolders);

      const result = await controller.getHolders(
        {
          ticker: 'TICKER',
          id: new BigNumber(1),
        },
        { size: new BigNumber(10) }
      );
      expect(result).toEqual(mockResult);
      expect(mockCheckpointsService.getHolders).toBeCalled();
    });
  });

  describe('getAssetBalance', () => {
    it('should return the balance of an Asset for an Identity at a given Checkpoint', async () => {
      const balance = new BigNumber(10);
      const ticker = 'TICKER';
      const did = '0x0600';
      const id = new BigNumber(1);

      const balanceModel = new IdentityBalanceModel({ balance, identity: did });

      mockCheckpointsService.getAssetBalance.mockResolvedValue(balanceModel);

      const result = await controller.getAssetBalance({
        ticker,
        did,
        id,
      });

      expect(result).toEqual(balanceModel);
      expect(mockCheckpointsService.getAssetBalance).toHaveBeenCalledWith(ticker, did, id);
    });
  });

  describe('deleteSchedule', () => {
    it('should return the transaction details', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockCheckpointsService.deleteScheduleByTicker.mockResolvedValue(response);

      const result = await controller.deleteSchedule(
        { id: new BigNumber(1), ticker: 'TICKER' },
        { signer: '0x6'.padEnd(66, '0') }
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
    });
  });
});
