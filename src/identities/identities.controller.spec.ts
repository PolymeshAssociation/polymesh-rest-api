import { Test } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { AuthorizationType } from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationsModule } from '~/authorizations/authorizations.module';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { IdentitiesService } from '~/identities/identities.service';
import { IdentityModel } from '~/identities/models/identity.model';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { PortfoliosModule } from '~/portfolios/portfolios.module';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { SettlementsService } from '~/settlements/settlements.service';
import { MockIdentityClass, MockPolymeshClass, MockPortfolio } from '~/test-utils/mocks';
import { TokensService } from '~/tokens/tokens.service';

import { IdentitiesController } from './identities.controller';

describe('IdentitiesController', () => {
  let controller: IdentitiesController;
  let mockPolymeshApi: MockPolymeshClass;
  const mockTokensService = {
    findAllByOwner: jest.fn(),
  };

  const mockSettlementsService = {
    findPendingInstructionsByDid: jest.fn(),
  };

  const mockIdentitiesService = {
    findOne: jest.fn(),
    parseIdentity: jest.fn(),
  };

  const mockAuthorizationsService = {
    parseAuthorizationRequest: jest.fn(),
  };

  const mockPortfoliosService = {
    parsePortfolio: jest.fn(),
  };
  let polymeshService: PolymeshService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module = await Test.createTestingModule({
      controllers: [IdentitiesController],
      imports: [PolymeshModule, PortfoliosModule, AuthorizationsModule],
      providers: [TokensService, SettlementsService, IdentitiesService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
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
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
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
        primaryKey: '5GNWrbft4pJcYSak9tkvUy89e2AKimEwHb6CKaJq81KHEj8e',
        secondaryKeysFrozen: false,
        secondaryKeys: [],
      });

      const mockIdentity = new MockIdentityClass();
      mockIdentity.getPrimaryKey.mockResolvedValue('XYZ');
      mockIdentity.areSecondaryKeysFrozen.mockResolvedValue(false);
      mockIdentity.getSecondaryKeys.mockResolvedValue([]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockIdentitiesService.parseIdentity.mockResolvedValue(mockIdentityDetails);

      const result = await controller.getIdentityDetails({ did });

      expect(result).toEqual(mockIdentityDetails);
    });
  });

  describe('getPendingAuthorizations', () => {
    it('should return list of pending authorizations received by identity', async () => {
      const did = '0x6'.padEnd(66, '0');
      const pendingAuthorization = new AuthorizationRequestModel({
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
      });

      const mockIdentity = new MockIdentityClass();
      mockIdentity.authorizations.getReceived.mockResolvedValue([pendingAuthorization]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockAuthorizationsService.parseAuthorizationRequest.mockResolvedValue(pendingAuthorization);
      const result = await controller.getPendingAuthorizations({ did }, {});
      expect(result).toEqual([pendingAuthorization]);
    });

    it('should support filtering pending authorizations by authorization type', async () => {
      const did = '0x6'.padEnd(66, '0');
      const mockIdentity = new MockIdentityClass();
      mockIdentity.authorizations.getReceived.mockResolvedValue([]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      const result = await controller.getPendingAuthorizations(
        { did },
        { type: AuthorizationType.JoinIdentity }
      );
      expect(result).toEqual([]);
    });

    it('should support filtering pending authorizations by expiry of authorization', async () => {
      const did = '0x6'.padEnd(66, '0');
      const mockIdentity = new MockIdentityClass();
      mockIdentity.authorizations.getReceived.mockResolvedValue([]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      const result = await controller.getPendingAuthorizations({ did }, {}, false);
      expect(result).toEqual([]);
    });
  });

  describe('getRequestedAuthorizations', () => {
    it('should return list of requested authorizations created by identity', async () => {
      const did = '0x6'.padEnd(66, '0');
      const mockRequestedAuthorizations = { next: undefined, results: [], total: 0 };

      const mockIdentity = new MockIdentityClass();
      mockIdentity.authorizations.getSent.mockResolvedValue({
        data: [],
        count: 0,
      });
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);

      const result = await controller.getRequestedAuthorizations({ did }, { size: 1 });

      expect(result).toEqual(mockRequestedAuthorizations);
    });
  });

  describe('getPortfolios', () => {
    it('should return list of all portfolios of an identity', async () => {
      const did = '0x6'.padEnd(66, '0');
      const mockIdentity = new MockIdentityClass();
      const mockPortfolio = new MockPortfolio();
      mockPortfolio.getTokenBalances.mockResolvedValue([]);
      mockPortfolio.isCustodiedBy.mockResolvedValue(true);
      mockPortfolio.getName.mockResolvedValue('P-1');
      mockIdentity.portfolios.getPortfolios.mockResolvedValue([mockPortfolio]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);

      const mockDetails = new PortfolioModel({
        id: new BigNumber(2),
        name: 'P-1',
        tokenBalances: [],
      });
      mockDetails.id = new BigNumber(1);
      mockDetails.name = 'P-1';
      mockDetails.tokenBalances = [];
      mockPortfoliosService.parsePortfolio.mockResolvedValue(mockDetails);
      const result = await controller.getPortfolios({ did });

      expect(result).toEqual([mockDetails]);
    });
  });
});
