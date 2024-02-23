import { Test, TestingModule } from '@nestjs/testing';

import { ProofServerService } from './proof-server.service';

describe('ProofServerService', () => {
  let service: ProofServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProofServerService],
    }).compile();

    service = module.get<ProofServerService>(ProofServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
