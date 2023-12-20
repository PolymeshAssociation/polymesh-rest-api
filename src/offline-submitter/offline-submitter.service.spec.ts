import { Test, TestingModule } from '@nestjs/testing';

import { OfflineSubmitterService } from '~/offline-submitter/offline-submitter.service';

describe('OfflineSubmitterService', () => {
  let service: OfflineSubmitterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfflineSubmitterService],
    }).compile();

    service = module.get<OfflineSubmitterService>(OfflineSubmitterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
