import { Test, TestingModule } from '@nestjs/testing';

import { SubsidyController } from '~/subsidy/subsidy.controller';

describe('SubsidyController', () => {
  let controller: SubsidyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubsidyController],
    }).compile();

    controller = module.get<SubsidyController>(SubsidyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
