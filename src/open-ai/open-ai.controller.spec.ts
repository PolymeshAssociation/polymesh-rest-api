import { Test, TestingModule } from '@nestjs/testing';

import { OpenAiController } from './open-ai.controller';

describe('OpenAiController', () => {
  let controller: OpenAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenAiController],
    }).compile();

    controller = module.get<OpenAiController>(OpenAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
