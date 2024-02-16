import { Test, TestingModule } from '@nestjs/testing';

import { ConfidentialTransactionsController } from './confidential-transactions.controller';

describe('ConfidentialTransactionsController', () => {
  let controller: ConfidentialTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialTransactionsController],
    }).compile();

    controller = module.get<ConfidentialTransactionsController>(ConfidentialTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
