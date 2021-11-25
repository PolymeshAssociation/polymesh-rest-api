import { Test, TestingModule } from '@nestjs/testing';
import { ClaimData, ClaimType, ResultSet } from '@polymathnetwork/polymesh-sdk/types';

import { ClaimsService } from '~/claims/claims.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymesh } from '~/test-utils/mocks';

describe('ClaimsService', () => {
  let claimsService: ClaimsService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
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

  describe('findIssuedByDid', () => {
    it('should return the issued Claims', async () => {
      const claimsResult = {
        data: [],
        next: null,
        count: 0,
      } as ResultSet<ClaimData>;
      mockPolymeshApi.claims.getIssuedClaims.mockResolvedValue(claimsResult);
      const result = await claimsService.findIssuedByDid('did');
      expect(result).toBe(claimsResult);
    });
  });

  describe('findAssociatedByDid', () => {
    it('should return the associated Claims', async () => {
      const did = '0x6'.padEnd(66, '1');
      const mockAssociatedClaims = [
        {
          issuedAt: '2020-08-21T16:36:55.000Z',
          expiry: null,
          claim: {
            type: ClaimType.Accredited,
            scope: {
              type: 'Identity',
              value: '0x9'.padEnd(66, '1'),
            },
          },
          target: {
            did,
          },
          issuer: {
            did: '0x6'.padEnd(66, '1'),
          },
        },
      ];

      const mockIdentitiesWithClaims = {
        data: [
          {
            identity: {
              did: '0x6',
            },
            claims: mockAssociatedClaims,
          },
        ],
        next: null,
        count: 1,
      };
      mockPolymeshApi.claims.getIdentitiesWithClaims.mockResolvedValue(mockIdentitiesWithClaims);
      const result = await claimsService.findAssociatedByDid(did);
      expect(result).toStrictEqual({
        data: mockAssociatedClaims,
        next: null,
        count: 1,
      });
    });
  });
});
