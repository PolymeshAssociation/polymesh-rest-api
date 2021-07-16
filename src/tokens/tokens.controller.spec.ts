import { Test, TestingModule } from '@nestjs/testing';

import { TokensService } from '~/tokens/tokens.service';

import { TokensController } from './tokens.controller';

describe('TokensController', () => {
  let controller: TokensController;
  const mockTokensService = {
    findDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [TokensService],
    })
      .overrideProvider(TokensService)
      .useValue(mockTokensService)
      .compile();

    controller = module.get<TokensController>(TokensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return the details', async () => {
      const mockDetails = {
        assetType: 'assetType',
        isDivisible: false,
        name: 'name',
        owner: 'owner',
        totalSupply: 'totalSupply',
      };
      mockTokensService.findDetails.mockResolvedValue(mockDetails);

      const result = await controller.findOne({ ticker: 'SOME_TICKER' });

      expect(result).toEqual(mockDetails);
    });
  });
});
