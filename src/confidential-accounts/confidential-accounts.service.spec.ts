import { Test, TestingModule } from '@nestjs/testing';

import { ConfidentialAccountsService } from './confidential-accounts.service';

describe('ConfidentialAccountsService', () => {
  let service: ConfidentialAccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfidentialAccountsService],
    }).compile();

    service = module.get<ConfidentialAccountsService>(ConfidentialAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
