import { Test, TestingModule } from '@nestjs/testing';

import relayerAccountsConfig from '~/relayer-accounts/config/relayer-accounts.config';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

describe('RelayerAccountsService', () => {
  let service: RelayerAccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelayerAccountsService, { provide: relayerAccountsConfig.KEY, useValue: {} }],
    }).compile();

    service = module.get<RelayerAccountsService>(RelayerAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
