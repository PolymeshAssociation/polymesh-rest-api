import { Test, TestingModule } from '@nestjs/testing';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { MockPolymesh } from '~/test-utils/mocks';

describe('PolymeshService', () => {
  let service: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();

    const module: TestingModule = await Test.createTestingModule({
      imports: [RelayerAccountsModule],
      providers: [PolymeshService, { provide: POLYMESH_API, useValue: mockPolymeshApi }],
    }).compile();

    service = module.get<PolymeshService>(PolymeshService);
  });

  afterAll(async () => {
    jest.useRealTimers();
    await service.close();
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ping the node every 10 seconds', () => {
    jest.advanceTimersByTime(20000);

    expect(mockPolymeshApi.getLatestBlock).toHaveBeenCalledTimes(2);
  });
});
