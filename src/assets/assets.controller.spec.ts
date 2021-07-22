import { Test, TestingModule } from '@nestjs/testing';

import { AssetsService } from '~/assets/assets.service';

import { AssetsController } from './assets.controller';

describe('AssetsController', () => {
  let controller: AssetsController;
  const mockAssetsService = {
    findDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [AssetsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDetails', () => {
    it('should return the details', async () => {
      const mockDetails = {
        assetType: 'assetType',
        isDivisible: false,
        name: 'name',
        owner: 'owner',
        totalSupply: 'totalSupply',
      };
      mockAssetsService.findDetails.mockResolvedValue(mockDetails);

      const result = await controller.getDetails({ ticker: 'SOME_TICKER' });

      expect(result).toEqual(mockDetails);
    });
  });
});
