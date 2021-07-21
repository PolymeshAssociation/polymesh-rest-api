import { Test } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { AuthorizationType } from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { ResultsModel } from '~/common/models/results.model';
import { IdentitiesService } from '~/identities/identities.service';
import { IdentityModel } from '~/identities/models/identity.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { SettlementsService } from '~/settlements/settlements.service';
import { MockIdentityClass, MockPortfolio } from '~/test-utils/mocks';
import { TokensService } from '~/tokens/tokens.service';

import { IdentitiesController } from './identities.controller';

describe('IdentitiesController', () => {
  let controller: IdentitiesController;
  const mockTokensService = {
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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [],
      controllers: [IdentitiesController],
      providers: [
        TokensService,
        SettlementsService,
        IdentitiesService,
        PortfoliosService,
        AuthorizationsService,
      ],
    })
      .overrideProvider(TokensService)
      .useValue(mockTokensService)
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .overrideProvider(PortfoliosService)
      .useValue(mockPortfoliosService)
      .overrideProvider(AuthorizationsService)
      .useValue(mockAuthorizationsService)
      .compile();

    controller = module.get<IdentitiesController>(IdentitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTokens', () => {
    it("should return the Identity's Tokens", async () => {
      const tokens = ['FOO', 'BAR', 'BAZ'];
      mockTokensService.findAllByOwner.mockResolvedValue(tokens);

      const result = await controller.getTokens({ did: '0x1' });

      expect(result).toEqual({ results: tokens });
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

    it('should support filtering pending authorizations by whether they have expired or not', async () => {
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
        tokenBalances: [],
      };
      const result = await controller.getPortfolios({ did });

      expect(result).toEqual(new ResultsModel({ results: [mockDetails] }));
    });
  });
});
