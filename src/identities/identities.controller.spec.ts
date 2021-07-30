import { Test } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { AuthorizationType, ClaimType } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { ClaimsService } from '~/claims/claims.service';
import { ResultsModel } from '~/common/models/results.model';
import { IdentitiesService } from '~/identities/identities.service';
import { IdentityModel } from '~/identities/models/identity.model';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { SettlementsService } from '~/settlements/settlements.service';
import { MockIdentityClass, MockPortfolio } from '~/test-utils/mocks';

import { IdentitiesController } from './identities.controller';

describe('IdentitiesController', () => {
  let controller: IdentitiesController;
  const mockAssetsService = {
    findAllByOwner: jest.fn(),
  };

  const mockSettlementsService = {
    findPendingInstructionsByDid: jest.fn(),
  };

  const mockIdentitiesService = {
    findOne: jest.fn(),
  };

  const mockAuthorizationsService = {
    findPendingByDid: jest.fn(),
    findIssuedByDid: jest.fn(),
  };

  const mockPortfoliosService = {
    findAllByOwner: jest.fn(),
  };

  const mockClaimsService = {
    findIssuedByDid: jest.fn(),
    findAssociatedByDid: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [IdentitiesController],
      providers: [
        AssetsService,
        SettlementsService,
        IdentitiesService,
        PortfoliosService,
        AuthorizationsService,
        ClaimsService,
        mockPolymeshLoggerProvider,
      ],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .overrideProvider(PortfoliosService)
      .useValue(mockPortfoliosService)
      .overrideProvider(AuthorizationsService)
      .useValue(mockAuthorizationsService)
      .overrideProvider(ClaimsService)
      .useValue(mockClaimsService)
      .compile();

    controller = module.get<IdentitiesController>(IdentitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAssets', () => {
    it("should return the Identity's Assets", async () => {
      const assets = ['FOO', 'BAR', 'BAZ'];
      mockAssetsService.findAllByOwner.mockResolvedValue(assets);

      const result = await controller.getAssets({ did: '0x1' });

      expect(result).toEqual({ results: assets });
    });
  });

  describe('getPendingInstructions', () => {
    it("should return the Identity's pending Instructions", async () => {
      const expectedInstructions = ['1', '2', '3'];
      mockSettlementsService.findPendingInstructionsByDid.mockResolvedValue(expectedInstructions);

      const result = await controller.getPendingInstructions({ did: '0x1' });

      expect(result).toEqual({ results: expectedInstructions });
    });
  });

  describe('getIdentityDetails', () => {
    it("should return the Identity's details", async () => {
      const did = '0x6'.padEnd(66, '0');

      const mockIdentityDetails = new IdentityModel({
        did,
        primaryKey: '5GNWrbft4pJcYSak9tkvUy89e2AKimEwHb6CKaJq81KHEj8e',
        secondaryKeysFrozen: false,
        secondaryKeys: [],
      });

      const mockIdentity = new MockIdentityClass();
      mockIdentity.did = did;
      mockIdentity.getPrimaryKey.mockResolvedValue(
        '5GNWrbft4pJcYSak9tkvUy89e2AKimEwHb6CKaJq81KHEj8e'
      );
      mockIdentity.areSecondaryKeysFrozen.mockResolvedValue(false);
      mockIdentity.getSecondaryKeys.mockResolvedValue([]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);

      const result = await controller.getIdentityDetails({ did });

      expect(result).toEqual(mockIdentityDetails);
    });
  });

  describe('getPendingAuthorizations', () => {
    it('should return list of pending authorizations received by identity', async () => {
      const did = '0x6'.padEnd(66, '0');
      const pendingAuthorization = {
        authId: new BigNumber(2236),
        issuer: {
          primaryKey: '5GNWrbft4pJcYSak9tkvUy89e2AKimEwHb6CKaJq81KHEj8e',
          did,
        },
        data: {
          type: AuthorizationType.TransferTicker,
          value: 'FOO',
        },
        expiry: null,
      };

      mockAuthorizationsService.findPendingByDid.mockResolvedValue([pendingAuthorization]);
      const result = await controller.getPendingAuthorizations({ did }, {});
      expect(result).toEqual(new ResultsModel({ results: [pendingAuthorization] }));
    });

    it('should support filtering pending authorizations by authorization type', async () => {
      const did = '0x6'.padEnd(66, '0');
      mockAuthorizationsService.findPendingByDid.mockResolvedValue([]);
      const result = await controller.getPendingAuthorizations(
        { did },
        { type: AuthorizationType.JoinIdentity }
      );
      expect(result).toEqual(new ResultsModel({ results: [] }));
    });

    it('should support filtering pending Authorizations by whether they have expired or not', async () => {
      const did = '0x6'.padEnd(66, '0');
      mockAuthorizationsService.findPendingByDid.mockResolvedValue([]);
      const result = await controller.getPendingAuthorizations({ did }, { includeExpired: false });
      expect(result).toEqual(new ResultsModel({ results: [] }));
    });
  });

  describe('getIssuedAuthorizations', () => {
    it('should return list of authorizations issued by an identity', async () => {
      const did = '0x6'.padEnd(66, '0');
      const mockRequestedAuthorizations = { next: undefined, results: [], total: 0 };
      mockAuthorizationsService.findIssuedByDid.mockResolvedValue({
        data: [],
        count: 0,
      });
      const result = await controller.getIssuedAuthorizations({ did }, { size: 1 });
      expect(result).toEqual(mockRequestedAuthorizations);
    });
  });

  describe('getPortfolios', () => {
    it('should return list of all portfolios of an identity', async () => {
      const did = '0x6'.padEnd(66, '0');
      const mockPortfolio = new MockPortfolio();
      mockPortfolio.getTokenBalances.mockResolvedValue([]);
      mockPortfolio.getCustodian.mockResolvedValue({ did });
      mockPortfolio.getName.mockResolvedValue('P-1');
      mockPortfoliosService.findAllByOwner.mockResolvedValue([mockPortfolio]);

      const mockDetails = {
        id: new BigNumber(1),
        name: 'P-1',
        assetBalances: [],
      };
      const result = await controller.getPortfolios({ did });

      expect(result).toEqual(new ResultsModel({ results: [mockDetails] }));
    });
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
    it('should give issued Claims with no start value', async () => {
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

    it('should give issued Claims with start value', async () => {
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
    const mockAssociatedClaims = {
      data: [
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
      ],
      next: null,
      count: 1,
    };

    it('should give associated Claims with no start value', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims({ did }, { size: 10 }, {});
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });

    it('should give associated Claims with start value', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims({ did }, { size: 10, start: 1 }, {});
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });

    it('should give associated Claims with claim type filter', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims(
        { did },
        { size: 10, start: 1 },
        { claimTypes: [ClaimType.Accredited] }
      );
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });

    it('should give associated Claims by whether they have expired or not', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims(
        { did },
        { size: 10, start: 1 },
        { includeExpired: true }
      );
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });
  });
});
