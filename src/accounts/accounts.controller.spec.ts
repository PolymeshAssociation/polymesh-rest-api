import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { MockAccountsService } from '~/test-utils/service-mocks';

describe('AccountsController', () => {
  let controller: AccountsController;

  const mockAccountsService = new MockAccountsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [AccountsService],
    })
      .overrideProvider(AccountsService)
      .useValue(mockAccountsService)
      .compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAccountBalance', () => {
    it('should call the service and return the results', async () => {
      const mockResult = {
        free: new BigNumber(10),
        locked: new BigNumber(1),
        total: new BigNumber(11),
      };
      mockAccountsService.getAccountBalance.mockResolvedValue(mockResult);

      const result = await controller.getAccountBalance({ account: '5xdd' });

      expect(result).toEqual(mockResult);
    });
  });
});
