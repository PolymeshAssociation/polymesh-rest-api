import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { CheckpointsController } from '~/checkpoints/checkpoints.controller';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';

describe('CheckpointsController', () => {
  let controller: CheckpointsController;

  const mockCheckpointsService = {
    findAllByTicker: jest.fn(),
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
});
