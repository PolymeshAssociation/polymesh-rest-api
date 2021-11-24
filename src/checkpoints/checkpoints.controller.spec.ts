import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';

import { CheckpointsController } from '~/checkpoints/checkpoints.controller';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { MockCheckpoint, MockCheckpointSchedule } from '~/test-utils/mocks';

describe('CheckpointsController', () => {
  let controller: CheckpointsController;

  const mockCheckpointsService = {
    findAllByTicker: jest.fn(),
    findSchedulesByTicker: jest.fn(),
    findScheduleById: jest.fn(),
    createByTicker: jest.fn(),
    createScheduleByTicker: jest.fn(),
  };

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

  describe('getCheckpoints', () => {
    const mockDate = new Date();
    const mockCheckpoints = {
      data: [
        {
          checkpoint: {
            id: new BigNumber(1),
          },
          createdAt: mockDate,
          totalSupply: new BigNumber('10000'),
        },
      ],
      next: '0xddddd',
      count: 2,
    };

    const mockResult = new PaginatedResultsModel({
      results: [
        {
          id: new BigNumber(1),
          createdAt: mockDate,
          totalSupply: new BigNumber('10000'),
        },
      ],
      total: 2,
      next: '0xddddd',
    });
    it('should return the list of Checkpoints created on an Asset', async () => {
      mockCheckpointsService.findAllByTicker.mockResolvedValue(mockCheckpoints);

      const result = await controller.getCheckpoints({ ticker: 'TICKER' }, { size: 1 });

      expect(result).toEqual(mockResult);
    });

    it('should return the list of Checkpoints created on an Asset from start key', async () => {
      mockCheckpointsService.findAllByTicker.mockResolvedValue(mockCheckpoints);

      const result = await controller.getCheckpoints(
        { ticker: 'TICKER' },
        { size: 1, start: 'START_KEY' }
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
            id: new BigNumber('1'),
            period: {
              unit: CalendarUnit.Month,
              amount: 3,
            },
            start: mockDate,
            complexity: 4,
            expiryDate: null,
          },
          details: {
            remainingCheckpoints: 1,
            nextCheckpointDate: mockDate,
          },
        },
      ];

      mockCheckpointsService.findSchedulesByTicker.mockResolvedValue(mockSchedules);

      const result = await controller.getSchedules({ ticker: 'TICKER' });

      const mockResult = [
        {
          id: new BigNumber('1'),
          ticker: 'TICKER',
          period: {
            unit: CalendarUnit.Month,
            amount: 3,
          },
          start: mockDate,
          complexity: 4,
          expiryDate: null,
          remainingCheckpoints: 1,
          nextCheckpointDate: mockDate,
        },
      ];

      expect(result).toEqual(new ResultsModel({ results: mockResult }));
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
          remainingCheckpoints: 1,
          nextCheckpointDate: mockDate,
        },
      };
      mockCheckpointsService.findScheduleById.mockResolvedValue(mockScheduleWithDetails);

      const body = {
        signer: 'signer',
        start: mockDate,
        period: { unit: CalendarUnit.Month, amount: 3 },
        repetitions: 2,
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
});
