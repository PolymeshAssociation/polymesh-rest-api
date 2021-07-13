import { Test, TestingModule } from '@nestjs/testing';
import { IdentityWithClaims } from '@polymathnetwork/polymesh-sdk/middleware/types';
import { ClaimData, ResultSet } from '@polymathnetwork/polymesh-sdk/types';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymeshClass } from '~/test-utils/mocks';

import { ClaimsService } from './claims.service';

describe('ClaimsService', () => {
  let claimsService: ClaimsService;
  let mockPolymeshApi: MockPolymeshClass;
  let polymeshService: PolymeshService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [ClaimsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    claimsService = module.get<ClaimsService>(ClaimsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(claimsService).toBeDefined();
  });

  describe('getIssuedClaims', () => {
    it('should return the issued claims', async () => {
      const claimsResult = {
        data: [],
        next: null,
        count: 0,
      } as ResultSet<ClaimData>;
      mockPolymeshApi.claims.getIssuedClaims.mockResolvedValue(claimsResult);
      const result = await claimsService.getIssuedClaims('did');
      expect(result).toBe(claimsResult);
    });
  });

  describe('getIdentitiesWithClaims', () => {
    it('should return the issued claims', async () => {
      const claimsResult = {
        data: [],
        next: null,
        count: 0,
      } as ResultSet<IdentityWithClaims>;
      mockPolymeshApi.claims.getIdentitiesWithClaims.mockResolvedValue(claimsResult);
      const result = await claimsService.getIdentitiesWithClaims('did');
      expect(result).toBe(claimsResult);
    });
  });
});
