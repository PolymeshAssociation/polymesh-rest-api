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
import { MockComplianceRequirements } from '~/assets/mocks/compliance-requirements.mock';
import { ComplianceRequirementsModel } from '~/assets/models/compliance-requirements.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { MockAsset } from '~/test-utils/mocks';
import { MockAssetService } from '~/test-utils/service-mocks';

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = new MockAssetService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [AssetsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
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
        identifiers: mockIdentifiers,
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

  describe('getComplianceRequirements', () => {
    it('should return the list of all compliance requirements of an Asset', async () => {
      const mockComplianceRequirements = new MockComplianceRequirements();
      mockAssetsService.findComplianceRequirements.mockResolvedValue(mockComplianceRequirements);

      const result = await controller.getComplianceRequirements({ ticker: 'SOME_TICKER' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).toEqual(new ComplianceRequirementsModel(mockComplianceRequirements as any));
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

  describe('reserveTicker', () => {
    it('should call the service and return the results', async () => {
      const input = { ticker: 'SOME_TICKER', signer: '0x6000' };
      const response = {
        transactions: [
          {
            blockHash: '0xfb3f745444ae63e66240d57eb9d769b0152af23214600425fe7c01f02512d960',
            transactionHash: '0xe16c51097d10e712b9f6ff572ca0c8c77ffcab0af8a8cb0598f8b891ab3ce46a',
            transactionTag: 'asset.reserveTicker',
          },
        ],
      };
      mockAssetsService.registerTicker.mockResolvedValue(response);

      const result = await controller.registerTicker(input);
      expect(result).toEqual(response);
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
        const response = {
          transactions: [
            {
              blockHash: '0xfb3f745444ae63e66240d57eb9d769b0152af23214600425fe7c01f02512d960',
              transactionHash: '0xe16c51097d10e712b9f6ff572ca0c8c77ffcab0af8a8cb0598f8b891ab3ce46a',
              transactionTag: 'asset.createAsset',
            },
          ],
        };
        mockAssetsService.createAsset.mockResolvedValue(response);

        const result = await controller.createAsset(input);
        expect(result).toEqual(response);
        expect(mockAssetsService.createAsset).toHaveBeenCalledWith(input);
      });
    });

    describe('issueAsset', () => {
      it('should call the service and return the results', async () => {
        const signer = '0x6000';
        const ticker = 'TICKER';
        const amount = new BigNumber('1000');
        const response = {
          transactions: [
            {
              blockHash: '0xfb3f745444ae63e66240d57eb9d769b0152af23214600425fe7c01f02512d960',
              transactionHash: '0xe16c51097d10e712b9f6ff572ca0c8c77ffcab0af8a8cb0598f8b891ab3ce46a',
              transactionTag: 'asset.issue',
            },
          ],
        };
        mockAssetsService.issue.mockResolvedValue(response);

        const result = await controller.issue({ ticker }, { signer, amount });
        expect(result).toEqual(response);
        expect(mockAssetsService.issue).toHaveBeenCalledWith(ticker, { signer, amount });
      });
    });
  });
});
