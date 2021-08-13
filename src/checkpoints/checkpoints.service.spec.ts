import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { MockSecurityTokenClass } from '~/test-utils/mocks';

import { AssetsService } from './../assets/assets.service';
import { CheckpointsService } from './checkpoints.service';

describe('CheckpointsService', () => {
  let service: CheckpointsService;

  const mockAssetsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckpointsService, AssetsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
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
      const mockSecurityToken = new MockSecurityTokenClass();
      mockSecurityToken.checkpoints.get.mockResolvedValue(mockCheckpoints);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findAllByTicker('TICKER', 1);

      expect(result).toEqual(mockCheckpoints);
    });

    it('should return the list of Checkpoints created on an Asset from start key', async () => {
      const mockSecurityToken = new MockSecurityTokenClass();
      mockSecurityToken.checkpoints.get.mockResolvedValue(mockCheckpoints);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findAllByTicker('TICKER', 1, 'START_KEY');

      expect(result).toEqual(mockCheckpoints);
    });
  });
});
