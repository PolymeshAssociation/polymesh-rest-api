import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  ClaimType,
  ConditionType,
  KnownTokenType,
  ScopeType,
  StoBalanceStatus,
  StoSaleStatus,
  StoTimingStatus,
  TokenIdentifierType,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsController } from '~/assets/assets.controller';
import { AssetsService } from '~/assets/assets.service';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { OfferingsService } from '~/offerings/offerings.service';
import { createOfferingDetailsModel } from '~/offerings/offerings.util';
import { MockSecurityTokenClass } from '~/test-utils/mocks';

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = {
    findOne: jest.fn(),
    findHolders: jest.fn(),
    findDocuments: jest.fn(),
    findComplianceRequirements: jest.fn(),
    findTrustedClaimIssuers: jest.fn(),
  };

  const mockOfferingsService = {
    findAllByTicker: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [AssetsService, OfferingsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(OfferingsService)
      .useValue(mockOfferingsService)
      .compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDetails', () => {
    it('should return the details', async () => {
      const mockTokenDetails = {
        assetType: KnownTokenType.EquityCommon,
        isDivisible: false,
        name: 'NAME',
        owner: {
          did: '0x6'.padEnd(66, '0'),
        },
        totalSupply: new BigNumber(1),
      };
      const mockIdentifiers = [
        {
          type: TokenIdentifierType.Isin,
          value: 'US000000000',
        },
      ];
      const mockSecurityToken = new MockSecurityTokenClass();
      mockSecurityToken.details.mockResolvedValue(mockTokenDetails);
      mockSecurityToken.getIdentifiers.mockResolvedValue(mockIdentifiers);
      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await controller.getDetails({ ticker: 'SOME_TICKER' });

      expect(result).toEqual({ ...mockTokenDetails, identifiers: mockIdentifiers });
    });
  });

  describe('getHolders', () => {
    const mockHolders = {
      data: [
        {
          identity: '0x6'.padEnd(66, '0'),
          balance: new BigNumber(1),
        },
      ],
      next: '0xddddd',
      count: 2,
    };

    it('should return the list of Asset holders', async () => {
      mockAssetsService.findHolders.mockResolvedValue(mockHolders);

      const result = await controller.getHolders({ ticker: 'SOME_TICKER' }, { size: 1 });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockHolders.data,
          total: mockHolders.count,
          next: mockHolders.next,
        })
      );
    });

    it('should return the list of Asset holders from a start value', async () => {
      mockAssetsService.findHolders.mockResolvedValue(mockHolders);

      const result = await controller.getHolders(
        { ticker: 'SOME_TICKER' },
        { size: 1, start: 'SOME_START_KEY' }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockHolders.data,
          total: mockHolders.count,
          next: mockHolders.next,
        })
      );
    });
  });

  describe('getDocuments', () => {
    const mockDocuments = {
      data: [
        {
          name: 'TEST-DOC',
          uri: 'URI',
          contentHash: 'None',
        },
      ],
      next: '0xddddd',
      count: 2,
    };

    it('should return the list of Asset documents', async () => {
      mockAssetsService.findDocuments.mockResolvedValue(mockDocuments);

      const result = await controller.getDocuments({ ticker: 'SOME_TICKER' }, { size: 1 });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockDocuments.data,
          total: mockDocuments.count,
          next: mockDocuments.next,
        })
      );
    });

    it('should return the list of Asset documents from a start value', async () => {
      mockAssetsService.findDocuments.mockResolvedValue(mockDocuments);

      const result = await controller.getDocuments(
        { ticker: 'SOME_TICKER' },
        { size: 1, start: 'SOME_START_KEY' }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockDocuments.data,
          total: mockDocuments.count,
          next: mockDocuments.next,
        })
      );
    });
  });

  describe('getComplianceRequirements', () => {
    it('should return the list of all compliance requirements of an Asset', async () => {
      const mockRequirements = [
        {
          id: 1,
          conditions: [
            {
              type: ConditionType.IsPresent,
              claim: {
                type: ClaimType.Accredited,
                scope: {
                  type: ScopeType.Identity,
                  value: 'Ox6'.padEnd(66, '0'),
                },
              },
              target: 'Receiver',
              trustedClaimIssuers: [],
            },
          ],
        },
      ];
      mockAssetsService.findComplianceRequirements.mockResolvedValue(mockRequirements);

      const result = await controller.getComplianceRequirements({ ticker: 'SOME_TICKER' });

      expect(result).toEqual(new ResultsModel({ results: mockRequirements }));
    });
  });

  describe('getTrustedClaimIssuers', () => {
    it('should return the list of all trusted Claim Issuers of an Asset', async () => {
      const mockClaimIssuers = [
        {
          did: 'Ox6'.padEnd(66, '0'),
          trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
        },
      ];
      mockAssetsService.findTrustedClaimIssuers.mockResolvedValue(mockClaimIssuers);

      const result = await controller.getTrustedClaimIssuers({ ticker: 'SOME_TICKER' });

      expect(result).toEqual({ results: mockClaimIssuers });
    });
  });

  describe('getOfferings', () => {
    it('should return the list of Offerings for an Asset', async () => {
      const mockOfferings = [
        {
          sto: {
            id: new BigNumber('1'),
          },
          details: {
            tiers: [
              {
                amount: new BigNumber('1000'),
                price: new BigNumber('1'),
                remaining: new BigNumber('1000'),
              },
            ],
            creator: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            name: 'SERIES A',
            offeringPortfolio: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            raisingPortfolio: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            raisingCurrency: 'CURRENCY',
            venue: {
              id: new BigNumber('1'),
            },
            start: new Date(),
            end: null,
            status: {
              timing: StoTimingStatus.Started,
              balance: StoBalanceStatus.Available,
              sale: StoSaleStatus.Live,
            },
            minInvestment: new BigNumber('1'),
            totalAmount: new BigNumber('1000'),
            totalRemaining: new BigNumber('1000'),
          },
        },
      ];

      mockOfferingsService.findAllByTicker.mockResolvedValue(mockOfferings);

      const result = await controller.getOfferings(
        { ticker: 'SOME_TICKER' },
        { timing: StoTimingStatus.Started }
      );

      const mockResult = new ResultsModel({
        results: mockOfferings.map(offering =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createOfferingDetailsModel(offering as any)
        ),
      });
      expect(result).toEqual(mockResult);
    });
  });
});
