import { Test, TestingModule } from '@nestjs/testing';

import { IdentitiesModule } from '~/identities/identities.module';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymeshClass } from '~/test-utils/mocks';

import { PortfoliosService } from './portfolios.service';

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [IdentitiesModule],
      providers: [PortfoliosService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<PortfoliosService>(PortfoliosService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
