import { Test, TestingModule } from '@nestjs/testing';

import { TokensService } from '~/tokens/tokens.service';

import { TokensController } from './tokens.controller';

describe('TokensController', () => {
  let controller: TokensController;
  const mockTokensService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      imports: [],
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
      const expectedTokens = { results: ['FOO', 'BAR', 'BAZ'] };
      mockTokensService.findOne.mockResolvedValue(expectedTokens);

      const result = await controller.findOne({ ticker: 'SOME_TICKER' });

      expect(result).toEqual(expectedTokens);
    });
  });
});
