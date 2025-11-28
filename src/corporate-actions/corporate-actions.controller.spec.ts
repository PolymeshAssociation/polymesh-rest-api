import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { CorporateActionsController } from '~/corporate-actions/corporate-actions.controller';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import {
  createDividendDistributionDetailsModel,
  createDividendDistributionModel,
} from '~/corporate-actions/corporate-actions.util';
import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';
import { MockDistribution } from '~/corporate-actions/mocks/dividend-distribution.mock';
import { DistributionPaymentModel } from '~/corporate-actions/models/distribution-payment.model';
import { testValues } from '~/test-utils/consts';
import {
  createMockDistributionPayment,
  createMockPaymentHistoryResult,
  testControllerTxResult,
} from '~/test-utils/test-helpers';

const { did, signer, txResult, assetId } = testValues;

describe('CorporateActionsController', () => {
  let controller: CorporateActionsController;

  const mockCorporateActionsService = {
    findDefaultConfigByAsset: jest.fn(),
    updateDefaultConfigByAsset: jest.fn(),
    findDistributionsByAsset: jest.fn(),
    findDistribution: jest.fn(),
    createDividendDistribution: jest.fn(),
    remove: jest.fn(),
    payDividends: jest.fn(),
    claimDividends: jest.fn(),
    linkDocuments: jest.fn(),
    reclaimRemainingFunds: jest.fn(),
    modifyCheckpoint: jest.fn(),
    findUnclaimedDistributionsByAsset: jest.fn(),
    getPaymentHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporateActionsController],
      providers: [CorporateActionsService],
    })
      .overrideProvider(CorporateActionsService)
      .useValue(mockCorporateActionsService)
      .compile();

    controller = module.get<CorporateActionsController>(CorporateActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDefaultConfig', () => {
    it('should return the Corporate Action Default Config for an Asset', async () => {
      const mockCorporateActionDefaultConfig = new MockCorporateActionDefaultConfig();

      mockCorporateActionsService.findDefaultConfigByAsset.mockResolvedValue(
        mockCorporateActionDefaultConfig
      );

      const result = await controller.getDefaultConfig({ asset: assetId });

      expect(result).toEqual(mockCorporateActionDefaultConfig);
    });
  });

  describe('updateDefaultConfig', () => {
    it('should update the Corporate Action Default Config and return the details of transaction', async () => {
      const body = {
        signer,
        defaultTaxWithholding: new BigNumber(25),
      };

      await testControllerTxResult(
        controller.updateDefaultConfig.bind(controller),
        mockCorporateActionsService.updateDefaultConfigByAsset,
        { asset: assetId },
        body,
        (params, bodyParam) => [params.asset, bodyParam]
      );
    });
  });

  describe('getDividendDistributions', () => {
    it('should return the Dividend Distributions associated with an Asset', async () => {
      const mockDistributions = [new MockDistributionWithDetails()];

      mockCorporateActionsService.findDistributionsByAsset.mockResolvedValue(mockDistributions);

      const result = await controller.getDividendDistributions({ asset: assetId });

      expect(result).toEqual(
        new ResultsModel({
          results: mockDistributions.map(distributionWithDetails =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            createDividendDistributionDetailsModel(distributionWithDetails as any)
          ),
        })
      );
    });
  });

  describe('findDistribution', () => {
    it('should return a specific Dividend Distribution associated with an Asset', async () => {
      const mockDistribution = new MockDistributionWithDetails();

      mockCorporateActionsService.findDistribution.mockResolvedValue(mockDistribution);

      const result = await controller.getDividendDistribution({
        asset: assetId,
        id: new BigNumber(1),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).toEqual(createDividendDistributionDetailsModel(mockDistribution as any));
    });
  });

  describe('createDividendDistribution', () => {
    it('should call the service and return the results', async () => {
      const mockDistribution = new MockDistribution();
      const response = {
        ...txResult,
        result: mockDistribution,
      };
      mockCorporateActionsService.createDividendDistribution.mockResolvedValue(response);
      const mockDate = new Date();
      const body = {
        signer,
        description: 'Corporate Action description',
        checkpoint: mockDate,
        originPortfolio: new BigNumber(0),
        currency: assetId,
        perShare: new BigNumber(2),
        maxAmount: new BigNumber(1000),
        paymentDate: mockDate,
      };

      const result = await controller.createDividendDistribution({ asset: assetId }, body);

      expect(result).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dividendDistribution: createDividendDistributionModel(mockDistribution as any),
        transactions: txResult.transactions,
        details: txResult.details,
      });
      expect(mockCorporateActionsService.createDividendDistribution).toHaveBeenCalledWith(
        assetId,
        body
      );
    });
  });

  describe('deleteCorporateAction', () => {
    it('should call the service and return the transaction details', async () => {
      await testControllerTxResult(
        controller.deleteCorporateAction.bind(controller),
        mockCorporateActionsService.remove,
        { id: new BigNumber(1), asset: assetId },
        { signer },
        (params, body) => [params.asset, params.id, body]
      );
    });
  });

  describe('payDividends', () => {
    it('should call the service and return the transaction details', async () => {
      const body = {
        signer,
        targets: [did],
      };

      await testControllerTxResult(
        controller.payDividends.bind(controller),
        mockCorporateActionsService.payDividends,
        {
          id: new BigNumber(1),
          asset: assetId,
        },
        body,
        (params, bodyParam) => [params.asset, params.id, bodyParam]
      );
    });
  });

  describe('linkDocuments', () => {
    it('should call the service and return the results', async () => {
      const body = {
        documents: [
          new AssetDocumentDto({
            name: 'DOC_NAME',
            uri: 'DOC_URI',
            type: 'DOC_TYPE',
          }),
        ],
        signer,
      };

      await testControllerTxResult(
        controller.linkDocuments.bind(controller),
        mockCorporateActionsService.linkDocuments,
        { asset: assetId, id: new BigNumber(1) },
        body
      );
    });
  });

  describe('claimDividends', () => {
    it('should call the service and return the transaction details', async () => {
      await testControllerTxResult(
        controller.claimDividends.bind(controller),
        mockCorporateActionsService.claimDividends,
        {
          id: new BigNumber(1),
          asset: assetId,
        },
        { signer },
        (params, body) => [params.asset, params.id, body]
      );
    });
  });

  describe('reclaimDividends', () => {
    it('should call the service and return the transaction details', async () => {
      await testControllerTxResult(
        controller.reclaimRemainingFunds.bind(controller),
        mockCorporateActionsService.reclaimRemainingFunds,
        {
          id: new BigNumber(1),
          asset: assetId,
        },
        { signer },
        (params, body) => [params.asset, params.id, body]
      );
    });
  });

  describe('modifyCheckpoint', () => {
    it('should call the service and return the results', async () => {
      const body = {
        checkpoint: new Date(),
        signer,
      };

      await testControllerTxResult(
        controller.modifyDistributionCheckpoint.bind(controller),
        mockCorporateActionsService.modifyCheckpoint,
        { asset: assetId, id: new BigNumber(1) },
        body,
        (params, bodyParam) => [params.asset, params.id, bodyParam]
      );
    });
  });

  describe('getPaymentHistory', () => {
    it('should return a paginated list of payments for a specific Dividend Distribution', async () => {
      const { payment, rest, targetDid } = createMockDistributionPayment(did);
      const mockPaginatedResult = createMockPaymentHistoryResult(payment);

      mockCorporateActionsService.getPaymentHistory.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getPaymentHistory(
        { asset: assetId, id: new BigNumber(1) },
        { size: new BigNumber(10), start: new BigNumber(0) }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: [new DistributionPaymentModel({ ...rest, did: targetDid })],
          next: new BigNumber(2),
        })
      );
    });

    it('should handle undefined start parameter', async () => {
      const { payment, rest, targetDid } = createMockDistributionPayment(did);
      const mockPaginatedResult = createMockPaymentHistoryResult(payment);

      mockCorporateActionsService.getPaymentHistory.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getPaymentHistory(
        { asset: assetId, id: new BigNumber(1) },
        { size: new BigNumber(10), start: undefined }
      );

      expect(mockCorporateActionsService.getPaymentHistory).toHaveBeenCalledWith(
        assetId,
        new BigNumber(1),
        new BigNumber(10),
        new BigNumber(0)
      );
      expect(result).toEqual(
        new PaginatedResultsModel({
          results: [new DistributionPaymentModel({ ...rest, did: targetDid })],
          next: new BigNumber(2),
        })
      );
    });
  });
});
