import { Test, TestingModule } from '@nestjs/testing';

import { AccountsService } from '~/accounts/accounts.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymesh } from '~/test-utils/mocks';

describe('AccountsService', () => {
  let service: AccountsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [AccountsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<AccountsService>(AccountsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccountBalance', () => {
    it('should return the POLYX balance for an Account', async () => {
      const fakeBalance = 'balance';

      mockPolymeshApi.accountManagement.getAccountBalance.mockReturnValue(fakeBalance);

      const result = await service.getAccountBalance('fakeAccount');

      expect(result).toBe(fakeBalance);
    });
  });
});
