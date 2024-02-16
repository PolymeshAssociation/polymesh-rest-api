import { Test, TestingModule } from '@nestjs/testing';

import { ConfidentialAssetsController } from './confidential-assets.controller';

describe('ConfidentialAssetsController', () => {
  let controller: ConfidentialAssetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialAssetsController],
    }).compile();

    controller = module.get<ConfidentialAssetsController>(ConfidentialAssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
