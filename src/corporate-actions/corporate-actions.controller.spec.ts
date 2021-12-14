import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { ResultsModel } from '~/common/models/results.model';
import { CorporateActionsController } from '~/corporate-actions/corporate-actions.controller';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { createDividendDistributionModel } from '~/corporate-actions/corporate-actions.util';
import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';

describe('CorporateActionsController', () => {
  let controller: CorporateActionsController;

  const mockCorporateActionsService = {
    findDefaultConfigByTicker: jest.fn(),
    updateDefaultConfigByTicker: jest.fn(),
    findDistributionsByTicker: jest.fn(),
    findDistribution: jest.fn(),
    remove: jest.fn(),
    payDividends: jest.fn(),
    claimDividends: jest.fn(),
    linkDocuments: jest.fn(),
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
        signer: '0x6'.padEnd(66, '0'),
        defaultTaxWithholding: new BigNumber('25'),
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
            createDividendDistributionModel(distributionWithDetails as any)
          ),
        })
      );
    });
  });

  describe('findDistribution', () => {
    it('should return a specific Dividend Distribution associated with an Asset', async () => {
      const mockDistributions = new MockDistributionWithDetails();

      mockCorporateActionsService.findDistribution.mockResolvedValue(mockDistributions);

      const result = await controller.getDividendDistribution({
        ticker: 'TICKER',
        id: new BigNumber('1'),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).toEqual(createDividendDistributionModel(mockDistributions as any));
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
        { signer: '0x6'.padEnd(66, '0') }
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockCorporateActionsService.remove).toHaveBeenCalledWith(
        'TICKER',
        new BigNumber(1),
        '0x6'.padEnd(66, '0')
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
        signer: '0x6'.padEnd(66, '0'),
        targets: ['0x6'.padEnd(66, '0')],
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
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.corporateAction.LinkCaDoc,
        },
      ];

      const body = {
        documents: [
          new AssetDocumentDto({
            name: 'DOC_NAME',
            uri: 'DOC_URI',
            type: 'DOC_TYPE',
          }),
        ],
        signer: '0x6'.padEnd(66, '0'),
      };

      mockCorporateActionsService.linkDocuments.mockResolvedValue({ transactions });

      const result = await controller.linkDocuments(
        { ticker: 'TICKER', id: new BigNumber('1') },
        body
      );

      expect(result).toEqual({
        transactions,
      });
    });
  });

  describe('claimDividends', () => {
    it('should call the service and return the transaction details', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockCorporateActionsService.claimDividends.mockResolvedValue(response);

      const signer = '0x6'.padEnd(66, '0');
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
});
