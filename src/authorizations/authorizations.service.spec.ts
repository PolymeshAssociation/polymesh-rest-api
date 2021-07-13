import { Test, TestingModule } from '@nestjs/testing';

import { IdentitiesModule } from '~/identities/identities.module';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfoliosModule } from '~/portfolios/portfolios.module';
import { MockPolymeshClass } from '~/test-utils/mocks';

import { AuthorizationsService } from './authorizations.service';

describe('AuthorizationService', () => {
  let authorizationsService: AuthorizationsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortfoliosModule, IdentitiesModule],
      providers: [AuthorizationsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    authorizationsService = module.get<AuthorizationsService>(AuthorizationsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(authorizationsService).toBeDefined();
  });
});
