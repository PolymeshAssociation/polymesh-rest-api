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
import { testValues } from '~/test-utils/consts';

const { did, signer } = testValues;

describe('CorporateActionsController', () => {
  let controller: CorporateActionsController;

  const mockCorporateActionsService = {
    findDefaultConfigByTicker: jest.fn(),
    updateDefaultConfigByTicker: jest.fn(),
    findDistributionsByTicker: jest.fn(),
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

      mockCorporateActionsService.findDefaultConfigByTicker.mockResolvedValue(
        mockCorporateActionDefaultConfig
      );

      const result = await controller.getDefaultConfig({ ticker: 'TICKER' });

      expect(result).toEqual(mockCorporateActionDefaultConfig);
    });
  });

  describe('updateDefaultConfig', () => {
    it('should update the Corporate Action Default Config and return the details of transaction', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockCorporateActionsService.updateDefaultConfigByTicker.mockResolvedValue(response);
      const body = {
        signer,
        defaultTaxWithholding: new BigNumber(25),
      };

      const result = await controller.updateDefaultConfig({ ticker: 'TICKER' }, body);

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.updateDefaultConfigByTicker).toHaveBeenCalledWith(
        'TICKER',
        body
      );
    });
  });

  describe('getDividendDistributions', () => {
    it('should return the Dividend Distributions associated with an Asset', async () => {
      const mockDistributions = [new MockDistributionWithDetails()];

      mockCorporateActionsService.findDistributionsByTicker.mockResolvedValue(mockDistributions);

      const result = await controller.getDividendDistributions({ ticker: 'TICKER' });

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
        ticker: 'TICKER',
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
        result: mockDistribution,
        transactions: ['transaction'],
      };
      mockCorporateActionsService.createDividendDistribution.mockResolvedValue(response);
      const mockDate = new Date();
      const body = {
        signer,
        description: 'Corporate Action description',
        checkpoint: mockDate,
        originPortfolio: new BigNumber(0),
        currency: 'TICKER',
        perShare: new BigNumber(2),
        maxAmount: new BigNumber(1000),
        paymentDate: mockDate,
      };

      const result = await controller.createDividendDistribution({ ticker: 'TICKER' }, body);

      expect(result).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dividendDistribution: createDividendDistributionModel(mockDistribution as any),
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.createDividendDistribution).toHaveBeenCalledWith(
        'TICKER',
        body
      );
    });
  });

  describe('deleteCorporateAction', () => {
    it('should call the service and return the transaction details', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockCorporateActionsService.remove.mockResolvedValue(response);

      const result = await controller.deleteCorporateAction(
        { id: new BigNumber(1), ticker: 'TICKER' },
        { signer }
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.remove).toHaveBeenCalledWith(
        'TICKER',
        new BigNumber(1),
        signer,
        undefined
      );
    });
  });

  describe('payDividends', () => {
    it('should call the service and return the transaction details', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockCorporateActionsService.payDividends.mockResolvedValue(response);

      const body = {
        signer,
        targets: [did],
      };
      const result = await controller.payDividends(
        {
          id: new BigNumber(1),
          ticker: 'TICKER',
        },
        body
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.payDividends).toHaveBeenCalledWith(
        'TICKER',
        new BigNumber(1),
        body
      );
    });
  });

  describe('linkDocuments', () => {
    it('should call the service and return the results', async () => {
      const transactions = ['transaction'];

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

      mockCorporateActionsService.linkDocuments.mockResolvedValue({ transactions });

      const result = await controller.linkDocuments(
        { ticker: 'TICKER', id: new BigNumber(1) },
        body
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
    });
  });

  describe('claimDividends', () => {
    it('should call the service and return the transaction details', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockCorporateActionsService.claimDividends.mockResolvedValue(response);

      const result = await controller.claimDividends(
        {
          id: new BigNumber(1),
          ticker: 'TICKER',
        },
        { signer }
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.claimDividends).toHaveBeenCalledWith(
        'TICKER',
        new BigNumber(1),
        signer
      );
    });
  });

  describe('reclaimDividends', () => {
    it('should call the service and return the transaction details', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockCorporateActionsService.reclaimRemainingFunds.mockResolvedValue(response);

      const result = await controller.reclaimRemainingFunds(
        {
          id: new BigNumber(1),
          ticker: 'TICKER',
        },
        { signer }
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.reclaimRemainingFunds).toHaveBeenCalledWith(
        'TICKER',
        new BigNumber(1),
        signer,
        undefined
      );
    });
  });

  describe('modifyCheckpoint', () => {
    it('should call the service and return the results', async () => {
      const transactions = ['transaction'];

      const body = {
        checkpoint: new Date(),
        signer,
      };

      mockCorporateActionsService.modifyCheckpoint.mockResolvedValue({ transactions });

      const result = await controller.modifyDistributionCheckpoint(
        { ticker: 'TICKER', id: new BigNumber(1) },
        body
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.modifyCheckpoint).toHaveBeenCalledWith(
        'TICKER',
        new BigNumber(1),
        body
      );
    });
  });
});
