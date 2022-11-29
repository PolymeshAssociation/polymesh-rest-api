import { Test, TestingModule } from '@nestjs/testing';

import { SubsidyService } from './subsidy.service';

describe('SubsidyService', () => {
  let service: SubsidyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubsidyService],
    }).compile();

    service = module.get<SubsidyService>(SubsidyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
