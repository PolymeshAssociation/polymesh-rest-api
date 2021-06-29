import { Test, TestingModule } from '@nestjs/testing';

import { IdentitiesService } from '~/identities/identities.service';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';

describe('SettlementsController', () => {
  let controller: SettlementsController;
  const mockSettlementsService = {};
  const mockIdentitiesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementsController],
      providers: [SettlementsService, IdentitiesService],
    })
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    controller = module.get<SettlementsController>(SettlementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
