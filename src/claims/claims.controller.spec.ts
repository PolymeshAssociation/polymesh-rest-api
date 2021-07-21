import { Test } from '@nestjs/testing';
import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';

import { ClaimsService } from '~/claims/claims.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymeshClass } from '~/test-utils/mocks';

import { ClaimsController } from './claims.controller';

describe('ClaimsController', () => {
  let controller: ClaimsController;
  let mockPolymeshApi: MockPolymeshClass;

  const mockClaimsService = {
    findIssuedByDid: jest.fn(),
    findAssociatedByDid: jest.fn(),
  };
  let polymeshService: PolymeshService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module = await Test.createTestingModule({
      controllers: [ClaimsController],
      imports: [PolymeshModule],
      providers: [ClaimsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(ClaimsService)
      .useValue(mockClaimsService)
      .compile();

    controller = module.get<ClaimsController>(ClaimsController);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getIssuedClaims', () => {
    const did = '0x6'.padEnd(66, '0');
    const targetDid = '0x6'.padEnd(66, '1');
    const claims = [
      {
        issuedAt: new Date(),
        expiry: null,
        claim: {
          type: 'CustomerDueDiligence',
          id: '0xcc32ef7ab217d4f1f8cc2ecea89e09234f3bbf8f96af56d55c819037d4603552',
        },
        target: {
          did: targetDid,
        },
        issuer: {
          did,
        },
      },
    ];
    const paginatedResult = {
      data: claims,
      next: null,
      count: 1,
    };
    it('should give issued claims with no start value', async () => {
      mockClaimsService.findIssuedByDid.mockResolvedValue(paginatedResult);
      const result = await controller.getIssuedClaims(
        { did },
        { size: 10 },
        { includeExpired: false }
      );
      expect(result).toEqual({
        total: paginatedResult.count,
        next: paginatedResult.next,
        results: paginatedResult.data,
      });
    });

    it('should give issued claims with start value', async () => {
      mockClaimsService.findIssuedByDid.mockResolvedValue(paginatedResult);
      const result = await controller.getIssuedClaims(
        { did },
        { size: 10, start: 1 },
        { includeExpired: false }
      );
      expect(result).toEqual({
        total: paginatedResult.count,
        next: paginatedResult.next,
        results: paginatedResult.data,
      });
    });
  });

  describe('getAssociatedClaims', () => {
    const did = '0x6'.padEnd(66, '0');
    const targetDid = '0x6'.padEnd(66, '1');
    const identity = {
      did,
    };
    const claims = [
      {
        issuedAt: new Date(),
        expiry: null,
        claim: {
          type: 'CustomerDueDiligence',
          id: '0xcc32ef7ab217d4f1f8cc2ecea89e09234f3bbf8f96af56d55c819037d4603552',
        },
        target: {
          did: targetDid,
        },
        issuer: {
          did,
        },
      },
    ];
    const paginatedResult = {
      data: [
        {
          identity,
          claims,
        },
      ],
      next: null,
      count: 1,
    };
    it('should give issued claims with no start value', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(paginatedResult);
      const result = await controller.getAssociatedClaims({ did }, { size: 10 }, {}, false);
      expect(result).toEqual({
        total: paginatedResult.count,
        next: paginatedResult.next,
        results: paginatedResult.data,
      });
    });

    it('should give issued claims with start value', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(paginatedResult);
      const result = await controller.getAssociatedClaims(
        { did },
        { size: 10, start: 1 },
        {},
        false
      );
      expect(result).toEqual({
        total: paginatedResult.count,
        next: paginatedResult.next,
        results: paginatedResult.data,
      });
    });

    it('should give issued claims with claim type filter', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(paginatedResult);
      const result = await controller.getAssociatedClaims(
        { did },
        { size: 10, start: 1 },
        { claimTypes: [ClaimType.Accredited] },
        false
      );
      expect(result).toEqual({
        total: paginatedResult.count,
        next: paginatedResult.next,
        results: paginatedResult.data,
      });
    });
  });
});
