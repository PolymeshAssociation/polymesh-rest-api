import { Test, TestingModule } from '@nestjs/testing';

import { OfflineRecorderService } from '~/offline-recorder/offline-recorder.service';

describe('OfflineRecorderService', () => {
  let service: OfflineRecorderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfflineRecorderService],
    }).compile();

    service = module.get<OfflineRecorderService>(OfflineRecorderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
