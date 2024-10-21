import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
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
import { processedTxResult, testValues } from '~/test-utils/consts';

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
      mockCorporateActionsService.updateDefaultConfigByAsset.mockResolvedValue(txResult);
      const body = {
        signer,
        defaultTaxWithholding: new BigNumber(25),
      };

      const result = await controller.updateDefaultConfig({ asset: assetId }, body);

      expect(result).toEqual(processedTxResult);
      expect(mockCorporateActionsService.updateDefaultConfigByAsset).toHaveBeenCalledWith(
        assetId,
        body
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
      mockCorporateActionsService.remove.mockResolvedValue(txResult);

      const result = await controller.deleteCorporateAction(
        { id: new BigNumber(1), asset: assetId },
        { signer }
      );

      expect(result).toEqual(processedTxResult);
      expect(mockCorporateActionsService.remove).toHaveBeenCalledWith(assetId, new BigNumber(1), {
        signer,
      });
    });
  });

  describe('payDividends', () => {
    it('should call the service and return the transaction details', async () => {
      mockCorporateActionsService.payDividends.mockResolvedValue(txResult);

      const body = {
        signer,
        targets: [did],
      };
      const result = await controller.payDividends(
        {
          id: new BigNumber(1),
          asset: assetId,
        },
        body
      );

      expect(result).toEqual(processedTxResult);
      expect(mockCorporateActionsService.payDividends).toHaveBeenCalledWith(
        assetId,
        new BigNumber(1),
        body
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

      mockCorporateActionsService.linkDocuments.mockResolvedValue(txResult);

      const result = await controller.linkDocuments({ asset: assetId, id: new BigNumber(1) }, body);

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('claimDividends', () => {
    it('should call the service and return the transaction details', async () => {
      mockCorporateActionsService.claimDividends.mockResolvedValue(txResult);

      const result = await controller.claimDividends(
        {
          id: new BigNumber(1),
          asset: assetId,
        },
        { signer }
      );

      expect(result).toEqual(processedTxResult);
      expect(mockCorporateActionsService.claimDividends).toHaveBeenCalledWith(
        assetId,
        new BigNumber(1),
        { signer }
      );
    });
  });

  describe('reclaimDividends', () => {
    it('should call the service and return the transaction details', async () => {
      mockCorporateActionsService.reclaimRemainingFunds.mockResolvedValue(txResult);

      const result = await controller.reclaimRemainingFunds(
        {
          id: new BigNumber(1),
          asset: assetId,
        },
        { signer }
      );

      expect(result).toEqual(processedTxResult);
      expect(mockCorporateActionsService.reclaimRemainingFunds).toHaveBeenCalledWith(
        assetId,
        new BigNumber(1),
        { signer }
      );
    });
  });

  describe('modifyCheckpoint', () => {
    it('should call the service and return the results', async () => {
      const body = {
        checkpoint: new Date(),
        signer,
      };

      mockCorporateActionsService.modifyCheckpoint.mockResolvedValue(txResult);

      const result = await controller.modifyDistributionCheckpoint(
        { asset: assetId, id: new BigNumber(1) },
        body
      );

      expect(result).toEqual(processedTxResult);
      expect(mockCorporateActionsService.modifyCheckpoint).toHaveBeenCalledWith(
        assetId,
        new BigNumber(1),
        body
      );
    });
  });
});
