import { Test } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { AuthorizationType, ClaimType } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { ClaimsService } from '~/claims/claims.service';
import { ResultsModel } from '~/common/models/results.model';
import { IdentitiesController } from '~/identities/identities.controller';
import { IdentitiesService } from '~/identities/identities.service';
import { AccountModel } from '~/identities/models/account.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { SettlementsService } from '~/settlements/settlements.service';
import { MockAuthorizationRequest, MockIdentity } from '~/test-utils/mocks';
import { MockAssetService } from '~/test-utils/service-mocks';

describe('IdentitiesController', () => {
  let controller: IdentitiesController;
  const mockAssetsService = new MockAssetService();

  const mockSettlementsService = {
    findPendingInstructionsByDid: jest.fn(),
  };

  const mockIdentitiesService = {
    findOne: jest.fn(),
    findTrustingAssets: jest.fn(),
    addSecondaryKey: jest.fn(),
  };

  const mockAuthorizationsService = {
    findPendingByDid: jest.fn(),
    findIssuedByDid: jest.fn(),
    findOne: jest.fn(),
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
        primaryAccount: {
          account: new AccountModel({
            address: '5GNWrbft4pJcYSak9tkvUy89e2AKimEwHb6CKaJq81KHEj8e',
          }),
          permissions: {
            portfolios: null,
            assets: null,
            transactions: null,
            transactionGroups: [],
          },
        },
        secondaryAccountsFrozen: false,
        secondaryAccounts: [],
      });

      const mockIdentity = new MockIdentity();
      mockIdentity.did = did;
      mockIdentity.getPrimaryAccount.mockResolvedValue({
        account: {
          address: '5GNWrbft4pJcYSak9tkvUy89e2AKimEwHb6CKaJq81KHEj8e',
        },
        permissions: {
          portfolios: null,
          assets: null,
          transactions: null,
          transactionGroups: [],
        },
      });
      mockIdentity.areSecondaryAccountsFrozen.mockResolvedValue(false);
      mockIdentity.getSecondaryAccounts.mockResolvedValue([]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);

      const result = await controller.getIdentityDetails({ did });

      expect(result).toEqual(mockIdentityDetails);
    });
  });

  describe('getPendingAuthorizations', () => {
    it('should return list of pending authorizations received by identity', async () => {
      const did = '0x6'.padEnd(66, '0');
      const targetDid = '0x1'.padEnd(66, '0');
      const pendingAuthorization = {
        authId: new BigNumber(2236),
        issuer: {
          did,
        },
        data: {
          type: AuthorizationType.TransferTicker,
          value: 'FOO',
        },
        expiry: null,
        target: {
          did: targetDid,
        },
      };

      mockAuthorizationsService.findPendingByDid.mockResolvedValue([pendingAuthorization]);
      const result = await controller.getPendingAuthorizations({ did }, {});
      expect(result).toEqual(
        new ResultsModel({
          results: [
            {
              id: pendingAuthorization.authId,
              issuer: {
                did: pendingAuthorization.issuer.did,
              },
              data: pendingAuthorization.data,
              expiry: null,
              target: new IdentitySignerModel({ did: targetDid }),
            },
          ],
        })
      );
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
      const mockRequestedAuthorizations = { next: undefined, results: [], total: new BigNumber(0) };
      mockAuthorizationsService.findIssuedByDid.mockResolvedValue({
        data: [],
        count: new BigNumber(0),
      });
      const result = await controller.getIssuedAuthorizations({ did }, { size: new BigNumber(1) });
      expect(result).toEqual(mockRequestedAuthorizations);
    });
  });

  describe('getPendingAuthorization', () => {
    it('should call the service and return the AuthorizationRequest details', async () => {
      const mockAuthorization = new MockAuthorizationRequest();
      mockAuthorizationsService.findOne.mockResolvedValue(mockAuthorization);
      const result = await controller.getPendingAuthorization({
        did: '0x6'.padEnd(66, '0'),
        id: new BigNumber(1),
      });
      expect(result).toEqual({
        id: mockAuthorization.authId,
        expiry: null,
        data: {
          type: 'PortfolioCustody',
          value: {
            did: mockAuthorization.data.value.did,
            id: new BigNumber(1),
          },
        },
        issuer: mockAuthorization.issuer,
        target: new IdentitySignerModel({ did: mockAuthorization.target.did }),
      });
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
      count: new BigNumber(1),
    };
    it('should give issued Claims with no start value', async () => {
      mockClaimsService.findIssuedByDid.mockResolvedValue(paginatedResult);
      const result = await controller.getIssuedClaims(
        { did },
        { size: new BigNumber(10) },
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
        { size: new BigNumber(10), start: new BigNumber(1) },
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
      count: new BigNumber(1),
    };

    it('should give associated Claims with no start value', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims({ did }, { size: new BigNumber(10) }, {});
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });

    it('should give associated Claims with start value', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims(
        { did },
        { size: new BigNumber(10), start: new BigNumber(1) },
        {}
      );
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });

    it('should give associated Claims with claim type filter', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims(
        { did },
        { size: new BigNumber(10), start: new BigNumber(1) },
        { claimTypes: [ClaimType.Accredited] }
      );
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });

    it('should give associated Claims by whether they have expired or not', async () => {
      mockClaimsService.findAssociatedByDid.mockResolvedValue(mockAssociatedClaims);
      const result = await controller.getAssociatedClaims(
        { did },
        { size: new BigNumber(10), start: new BigNumber(1) },
        { includeExpired: true }
      );
      expect(result).toEqual(new ResultsModel({ results: mockAssociatedClaims.data }));
    });
  });

  describe('getTrustingAssets', () => {
    it('should return the list of Assets for which the Identity is a default trusted Claim Issuer', async () => {
      const did = '0x6'.padEnd(66, '0');
      const mockAssets = [
        {
          ticker: 'BAR_TICKER',
        },
        {
          ticker: 'FOO_TICKER',
        },
      ];
      mockIdentitiesService.findTrustingAssets.mockResolvedValue(mockAssets);

      const result = await controller.getTrustingAssets({ did });

      expect(result).toEqual(new ResultsModel({ results: mockAssets }));
    });
  });

  describe('addSecondaryKey', () => {
    it('should return the transaction details on adding a Secondary Key', async () => {
      const transactions = ['transaction'];
      const mockAuthorization = new MockAuthorizationRequest();
      const mockData = {
        result: mockAuthorization,
        transactions,
      };
      mockIdentitiesService.addSecondaryKey.mockResolvedValue(mockData);

      const result = await controller.addSecondaryKey({ signer: 'Ox60', secondaryKey: '5xdd' });

      expect(result).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
        transactions,
      });
    });
  });
});
