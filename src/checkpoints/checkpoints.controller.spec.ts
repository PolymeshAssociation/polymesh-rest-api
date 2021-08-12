import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { CalendarUnit } from '@polymathnetwork/polymesh-sdk/types';

import { CheckpointsController } from '~/checkpoints/checkpoints.controller';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';

describe('CheckpointsController', () => {
  let controller: CheckpointsController;

  const mockCheckpointsService = {
    findAllByTicker: jest.fn(),
    findSchedules: jest.fn(),
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

    const mockResult = new PaginatedResultsModel({
      results: [
        {
          id: new BigNumber(1),
          createdAt: new Date(),
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

  describe('findSchedules', () => {
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

      mockCheckpointsService.findSchedules.mockResolvedValue(mockSchedules);

      const result = await controller.getSchedules({ ticker: 'TICKER' });

      const mockResult = [
        {
          id: new BigNumber('1'),
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
});
