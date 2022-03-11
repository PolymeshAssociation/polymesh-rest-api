import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  ClaimType,
  KnownAssetType,
  SecurityIdentifierType,
} from '@polymathnetwork/polymesh-sdk/types';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';
import { AssetsController } from '~/assets/assets.controller';
import { AssetsService } from '~/assets/assets.service';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ComplianceService } from '~/compliance/compliance.service';
import { MockAsset } from '~/test-utils/mocks';
import { MockAssetService, MockComplianceService } from '~/test-utils/service-mocks';

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = new MockAssetService();
  const mockComplianceService = new MockComplianceService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [AssetsService, ComplianceService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(ComplianceService)
      .useValue(mockComplianceService)
      .compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDetails', () => {
    it('should return the details', async () => {
      const mockAssetDetails = {
        assetType: KnownAssetType.EquityCommon,
        isDivisible: false,
        name: 'NAME',
        owner: {
          did: '0x6'.padEnd(66, '0'),
        },
        totalSupply: new BigNumber(1),
      };
      const mockIdentifiers = [
        {
          type: SecurityIdentifierType.Isin,
          value: 'US000000000',
        },
      ];
      const mockAsset = new MockAsset();
      mockAsset.details.mockResolvedValue(mockAssetDetails);
      mockAsset.getIdentifiers.mockResolvedValue(mockIdentifiers);

      const mockFundingRound = 'Series A';
      mockAsset.currentFundingRound.mockResolvedValue(mockFundingRound);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await controller.getDetails({ ticker: 'SOME_TICKER' });

      const mockResult = {
        ...mockAssetDetails,
        securityIdentifiers: mockIdentifiers,
        fundingRound: mockFundingRound,
      };

      expect(result).toEqual(mockResult);
    });
  });

  describe('getHolders', () => {
    const mockHolders = {
      data: [
        {
          identity: { did: '0x6'.padEnd(66, '0') },
          balance: new BigNumber(1),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    it('should return the list of Asset holders', async () => {
      mockAssetsService.findHolders.mockResolvedValue(mockHolders);

      const result = await controller.getHolders(
        { ticker: 'SOME_TICKER' },
        { size: new BigNumber(1) }
      );
      const expectedResults = mockHolders.data.map(holder => {
        return { identity: holder.identity.did, balance: holder.balance };
      });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: expectedResults,
          total: new BigNumber(mockHolders.count),
          next: mockHolders.next,
        })
      );
    });

    it('should return the list of Asset holders from a start value', async () => {
      mockAssetsService.findHolders.mockResolvedValue(mockHolders);

      const result = await controller.getHolders(
        { ticker: 'SOME_TICKER' },
        { size: new BigNumber(1), start: 'SOME_START_KEY' }
      );

      const expectedResults = mockHolders.data.map(holder => {
        return { identity: holder.identity.did, balance: holder.balance };
      });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: expectedResults,
          total: new BigNumber(mockHolders.count),
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
          contentHash: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    it('should return the list of Asset documents', async () => {
      mockAssetsService.findDocuments.mockResolvedValue(mockDocuments);

      const result = await controller.getDocuments(
        { ticker: 'SOME_TICKER' },
        { size: new BigNumber(1) }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockDocuments.data,
          total: new BigNumber(mockDocuments.count),
          next: mockDocuments.next,
        })
      );
    });

    it('should return the list of Asset documents from a start value', async () => {
      mockAssetsService.findDocuments.mockResolvedValue(mockDocuments);

      const result = await controller.getDocuments(
        { ticker: 'SOME_TICKER' },
        { size: new BigNumber(1), start: 'SOME_START_KEY' }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockDocuments.data,
          total: new BigNumber(mockDocuments.count),
          next: mockDocuments.next,
        })
      );
    });
  });

  describe('getTrustedClaimIssuers', () => {
    it('should return the list of all trusted Claim Issuers of an Asset', async () => {
      const mockClaimIssuers = [
        {
          identity: {
            did: 'Ox6'.padEnd(66, '0'),
          },
          trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
        },
      ];
      mockComplianceService.findTrustedClaimIssuers.mockResolvedValue(mockClaimIssuers);

      const result = await controller.getTrustedClaimIssuers({ ticker: 'SOME_TICKER' });

      expect(result).toEqual({
        results: [
          {
            did: 'Ox6'.padEnd(66, '0'),
            trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
          },
        ],
      });
    });
  });

  describe('reserveTicker', () => {
    it('should call the service and return the results', async () => {
      const input = { ticker: 'SOME_TICKER', signer: '0x6000' };
      mockAssetsService.registerTicker.mockResolvedValue({ transactions: ['transaction'] });

      const result = await controller.registerTicker(input);
      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockAssetsService.registerTicker).toHaveBeenCalledWith(input);
    });

    describe('createAsset', () => {
      it('should call the service and return the results', async () => {
        const input = {
          signer: '0x6000',
          name: 'Berkshire Class A',
          ticker: 'BRK.A',
          isDivisible: false,
          assetType: KnownAssetType.EquityCommon,
          requireInvestorUniqueness: false,
        };
        mockAssetsService.createAsset.mockResolvedValue({ transactions: ['transaction'] });

        const result = await controller.createAsset(input);
        expect(result).toEqual({ transactions: ['transaction'] });
        expect(mockAssetsService.createAsset).toHaveBeenCalledWith(input);
      });
    });

    describe('issueAsset', () => {
      it('should call the service and return the results', async () => {
        const signer = '0x6000';
        const ticker = 'TICKER';
        const amount = new BigNumber(1000);
        mockAssetsService.issue.mockResolvedValue({ transactions: ['transaction'] });

        const result = await controller.issue({ ticker }, { signer, amount });
        expect(result).toEqual({ transactions: ['transaction'] });
        expect(mockAssetsService.issue).toHaveBeenCalledWith(ticker, { signer, amount });
      });
    });
  });
});
