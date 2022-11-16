import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { KnownAssetType, SecurityIdentifierType } from '@polymeshassociation/polymesh-sdk/types';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';
import { AssetsController } from '~/assets/assets.controller';
import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { testValues } from '~/test-utils/consts';
import { MockAsset, MockAuthorizationRequest } from '~/test-utils/mocks';
import { MockAssetService, MockComplianceRequirementsService } from '~/test-utils/service-mocks';

const { signer, did } = testValues;

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = new MockAssetService();
  const mockComplianceRequirementsService = new MockComplianceRequirementsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [AssetsService, ComplianceRequirementsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(ComplianceRequirementsService)
      .useValue(mockComplianceRequirementsService)
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
          did,
        },
        totalSupply: new BigNumber(1),
      };
      const mockIdentifiers = [
        {
          type: SecurityIdentifierType.Isin,
          value: 'US000000000',
        },
      ];
      const mockAssetIsFrozen = false;
      const mockAsset = new MockAsset();
      mockAsset.details.mockResolvedValue(mockAssetDetails);
      mockAsset.getIdentifiers.mockResolvedValue(mockIdentifiers);
      mockAsset.isFrozen.mockResolvedValue(mockAssetIsFrozen);

      const mockFundingRound = 'Series A';
      mockAsset.currentFundingRound.mockResolvedValue(mockFundingRound);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await controller.getDetails({ ticker: 'TICKER' });

      const mockResult = {
        ...mockAssetDetails,
        securityIdentifiers: mockIdentifiers,
        fundingRound: mockFundingRound,
        isFrozen: mockAssetIsFrozen,
      };

      expect(result).toEqual(mockResult);
    });
  });

  describe('getHolders', () => {
    const mockHolders = {
      data: [
        {
          identity: { did },
          balance: new BigNumber(1),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    it('should return the list of Asset holders', async () => {
      mockAssetsService.findHolders.mockResolvedValue(mockHolders);

      const result = await controller.getHolders({ ticker: 'TICKER' }, { size: new BigNumber(1) });
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
        { ticker: 'TICKER' },
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
        { ticker: 'TICKER' },
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
        { ticker: 'TICKER' },
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

  describe('setDocuments', () => {
    it('should call the service and return the results', async () => {
      const transactions = ['transaction'];
      const body = {
        signer: '0x6000',
        documents: [
          new AssetDocumentDto({
            name: 'TEST-DOC',
            uri: 'URI',
            contentHash: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
          }),
        ],
      };
      const ticker = 'TICKER';
      mockAssetsService.setDocuments.mockResolvedValue({ transactions });

      const result = await controller.setDocuments({ ticker }, body);
      expect(result).toEqual({ transactions });
      expect(mockAssetsService.setDocuments).toHaveBeenCalledWith(ticker, body);
    });
  });

  describe('createAsset', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer: '0x6000',
        name: 'Ticker Corp',
        ticker: 'TICKER',
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

  describe('issue', () => {
    it('should call the service and return the results', async () => {
      const ticker = 'TICKER';
      const amount = new BigNumber(1000);
      mockAssetsService.issue.mockResolvedValue({ transactions: ['transaction'] });

      const result = await controller.issue({ ticker }, { signer, amount });
      expect(result).toEqual({ transactions: ['transaction'] });
      expect(mockAssetsService.issue).toHaveBeenCalledWith(ticker, { signer, amount });
    });
  });

  describe('transferOwnership', () => {
    it('should call the service and return the results', async () => {
      const mockAuthorization = new MockAuthorizationRequest();
      const mockData = {
        result: mockAuthorization,
        transactions: ['transaction'],
      };
      mockAssetsService.transferOwnership.mockResolvedValue(mockData);

      const body = { signer: '0x6000', target: '0x1000' };
      const ticker = 'SOME_TICKER';

      const result = await controller.transferOwnership({ ticker }, body);

      expect(result).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
        transactions: ['transaction'],
      });
      expect(mockAssetsService.transferOwnership).toHaveBeenCalledWith(ticker, body);
    });
  });

  describe('redeem', () => {
    it('should call the service and return the results', async () => {
      const ticker = 'TICKER';
      const amount = new BigNumber(1000);
      const from = new BigNumber(1);
      mockAssetsService.redeem.mockResolvedValue({ transactions: ['transaction'] });

      const result = await controller.redeem({ ticker }, { signer, amount, from });
      expect(result).toEqual({ transactions: ['transaction'] });
      expect(mockAssetsService.redeem).toHaveBeenCalledWith(ticker, { signer, amount, from });
    });
  });

  describe('freeze', () => {
    it('should call the service and return the results', async () => {
      const ticker = 'TICKER';
      mockAssetsService.freeze.mockResolvedValue({ transactions: ['transaction'] });

      const result = await controller.freeze({ ticker }, { signer });
      expect(result).toEqual({ transactions: ['transaction'] });
      expect(mockAssetsService.freeze).toHaveBeenCalledWith(ticker, { signer });
    });
  });

  describe('unfreeze', () => {
    it('should call the service and return the results', async () => {
      const ticker = 'TICKER';
      mockAssetsService.unfreeze.mockResolvedValue({ transactions: ['transaction'] });

      const result = await controller.unfreeze({ ticker }, { signer });
      expect(result).toEqual({ transactions: ['transaction'] });
      expect(mockAssetsService.unfreeze).toHaveBeenCalledWith(ticker, { signer });
    });
  });

  describe('controllerTransfer', () => {
    it('should call the service and return the results', async () => {
      const ticker = 'TICKER';
      const amount = new BigNumber(1000);
      const origin = new PortfolioDto({ id: new BigNumber(1), did: '0x1000' });

      mockAssetsService.controllerTransfer.mockResolvedValue({ transactions: ['transaction'] });

      const result = await controller.controllerTransfer({ ticker }, { signer, origin, amount });

      expect(result).toEqual({ transactions: ['transaction'] });
      expect(mockAssetsService.controllerTransfer).toHaveBeenCalledWith(ticker, {
        signer,
        origin,
        amount,
      });
    });
  });

  describe('getOperationHistory', () => {
    it('should call the service and return the results', async () => {
      const mockAgent = {
        did: 'Ox6'.padEnd(66, '0'),
      };
      const mockHistory = [
        {
          blockNumber: new BigNumber(123),
          blockHash: 'blockHash',
          blockDate: new Date('07/11/2022'),
          eventIndex: new BigNumber(1),
        },
      ];
      const mockAgentOperations = [
        {
          identity: mockAgent,
          history: mockHistory,
        },
      ];
      mockAssetsService.getOperationHistory.mockResolvedValue(mockAgentOperations);

      const result = await controller.getOperationHistory({ ticker: 'TICKER' });

      expect(result).toEqual([
        {
          did: mockAgent.did,
          history: mockHistory,
        },
      ]);
    });
  });
});
