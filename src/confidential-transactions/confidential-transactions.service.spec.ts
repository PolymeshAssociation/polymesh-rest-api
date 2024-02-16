import { Test, TestingModule } from '@nestjs/testing';

import { ConfidentialTransactionsService } from './confidential-transactions.service';

describe('ConfidentialTransactionsService', () => {
  let service: ConfidentialTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfidentialTransactionsService],
    }).compile();

    service = module.get<ConfidentialTransactionsService>(ConfidentialTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
