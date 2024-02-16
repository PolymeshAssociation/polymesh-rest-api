import { Test, TestingModule } from '@nestjs/testing';

import { ConfidentialAccountsController } from '~/confidential-accounts/confidential-accounts.controller';

describe('ConfidentialAccountsController', () => {
  let controller: ConfidentialAccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialAccountsController],
    }).compile();

    controller = module.get<ConfidentialAccountsController>(ConfidentialAccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
