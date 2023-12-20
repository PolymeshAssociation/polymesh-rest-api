import { Test, TestingModule } from '@nestjs/testing';

import { OfflineStarterService } from './offline-starter.service';

describe('OfflineStarterService', () => {
  let service: OfflineStarterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfflineStarterService],
    }).compile();

    service = module.get<OfflineStarterService>(OfflineStarterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
