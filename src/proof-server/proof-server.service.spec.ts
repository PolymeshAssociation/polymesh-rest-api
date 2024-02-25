import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import proofServerConfig from '~/proof-server/config/proof-server.config';
import { ProofServerService } from '~/proof-server/proof-server.service';
import { MockHttpService } from '~/test-utils/service-mocks';

describe('ProofServerService', () => {
  let service: ProofServerService;
  let mockHttpService: MockHttpService;
  const proofServerApi = 'http://some-api.com/api/v1';

  beforeEach(async () => {
    mockHttpService = new MockHttpService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProofServerService,
        HttpService,
        mockPolymeshLoggerProvider,
        {
          provide: proofServerConfig.KEY,
          useValue: { proofServerApi },
        },
      ],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    service = module.get<ProofServerService>(ProofServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
