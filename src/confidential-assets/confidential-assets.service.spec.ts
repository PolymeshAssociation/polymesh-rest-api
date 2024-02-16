import { Test, TestingModule } from '@nestjs/testing';

import { ConfidentialAssetsService } from './confidential-assets.service';

describe('ConfidentialAssetsService', () => {
  let service: ConfidentialAssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfidentialAssetsService],
    }).compile();

    service = module.get<ConfidentialAssetsService>(ConfidentialAssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
