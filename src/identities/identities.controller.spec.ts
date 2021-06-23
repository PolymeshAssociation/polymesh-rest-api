import { Test } from '@nestjs/testing';

import { IdentitiesService } from '~/identities/identities.service';
import { SettlementsService } from '~/settlements/settlements.service';
import { TokensService } from '~/tokens/tokens.service';

import { IdentitiesController } from './identities.controller';

describe('IdentitiesController', () => {
  let controller: IdentitiesController;
  const mockTokensService = {
    findAllByOwner: jest.fn(),
  };

  const mockSettlementsService = {
    findPendingInstructionsByDid: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [IdentitiesController],
      imports: [],
      providers: [TokensService, IdentitiesService, SettlementsService],
    })
      .overrideProvider(TokensService)
      .useValue(mockTokensService)
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .compile();

    controller = module.get<IdentitiesController>(IdentitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTokens', () => {
    it("should return the Identity's Tokens", async () => {
      const expectedTokens = ['FOO', 'BAR', 'BAZ'];
      mockTokensService.findAllByOwner.mockResolvedValue(expectedTokens);

      const result = await controller.getTokens({ did: '0x1' });

      expect(result).toEqual(expectedTokens);
    });
  });

  describe('getPendingInstructions', () => {
    it("should return the Identity's pending Instructions", async () => {
      const expectedInstructions = ['1', '2', '3'];
      mockSettlementsService.findPendingInstructionsByDid.mockResolvedValue(expectedInstructions);

      const result = await controller.getPendingInstructions({ did: '0x1' });

      expect(result).toEqual(expectedInstructions);
    });
  });
});
