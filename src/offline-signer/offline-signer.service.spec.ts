import { Test, TestingModule } from '@nestjs/testing';

import { OfflineSignerService } from '~/offline-signer/offline-signer.service';

describe('OfflineSignerService', () => {
  let service: OfflineSignerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfflineSignerService],
    }).compile();

    service = module.get<OfflineSignerService>(OfflineSignerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
