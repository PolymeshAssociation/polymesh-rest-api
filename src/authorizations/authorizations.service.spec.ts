import { Test, TestingModule } from '@nestjs/testing';

import { AuthorizationsService } from './authorizations.service';

describe('AuthorizationService', () => {
  let service: AuthorizationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationsService],
    }).compile();

    service = module.get<AuthorizationsService>(AuthorizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
