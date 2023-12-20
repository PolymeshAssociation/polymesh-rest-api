import { Test, TestingModule } from '@nestjs/testing';

import { ArtemisService } from '~/artemis/artemis.service';

describe('ArtemisService', () => {
  let service: ArtemisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtemisService],
    }).compile();

    service = module.get<ArtemisService>(ArtemisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
