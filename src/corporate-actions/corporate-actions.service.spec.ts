/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { CaCheckpointType, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';
import { MockDistribution } from '~/corporate-actions/mocks/dividend-distribution.mock';
import { testValues } from '~/test-utils/consts';
import { MockAsset, MockTransaction } from '~/test-utils/mocks';
import { MockAssetService, mockTransactionsProvider } from '~/test-utils/service-mocks';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { signer } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('CorporateActionsService', () => {
  let service: CorporateActionsService;

  const mockAssetsService = new MockAssetService();

  const mockTransactionsService = mockTransactionsProvider.useValue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporateActionsService, AssetsService, mockTransactionsProvider],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<CorporateActionsService>(CorporateActionsService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  describe('findDefaultConfigByTicker', () => {
    it('should return the Corporate Action Default Config for an Asset', async () => {
      const mockCorporateActionDefaultConfig = new MockCorporateActionDefaultConfig();

      const mockAsset = new MockAsset();
      mockAsset.corporateActions.getDefaultConfig.mockResolvedValue(
        mockCorporateActionDefaultConfig
      );

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findDefaultConfigByTicker('TICKER');

      expect(result).toEqual(mockCorporateActionDefaultConfig);
    });
  });

  describe('updateDefaultConfigByTicker', () => {
    let mockAsset: MockAsset;
    const ticker = 'TICKER';

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
    });

    it('should run a setDefaultConfig procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.corporateAction.SetDefaultWithholdingTax,
      };
      const mockTransaction = new MockTransaction(transaction);

      mockAsset.corporateActions.setDefaultConfig.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const body = {
        signer,
        defaultTaxWithholding: new BigNumber(25),
      };
      const result = await service.updateDefaultConfigByTicker(ticker, body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.corporateActions.setDefaultConfig,
        { defaultTaxWithholding: new BigNumber(25) },
        { signer }
      );
      expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
    });
  });

  describe('findDistributionsByTicker', () => {
    it('should return the Dividend Distributions associated with an Asset', async () => {
      const mockDistributions = [new MockDistributionWithDetails()];

      const mockAsset = new MockAsset();
      mockAsset.corporateActions.distributions.get.mockResolvedValue(mockDistributions);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findDistributionsByTicker('TICKER');

      expect(result).toEqual(mockDistributions);
    });
  });

  describe('findDistribution', () => {
    it('should return a specific Dividend Distribution associated with an given ticker', async () => {
      const mockDistributions = new MockDistributionWithDetails();

      const mockAsset = new MockAsset();
      mockAsset.corporateActions.distributions.getOne.mockResolvedValue(mockDistributions);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findDistribution('TICKER', new BigNumber(1));

      expect(result).toEqual(mockDistributions);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockAsset = new MockAsset();
        const mockError = new Error('Some Error');
        mockAsset.corporateActions.distributions.getOne.mockImplementation(() => {
          throw mockError;
        });
        mockAssetsService.findOne.mockResolvedValue(mockAsset);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() =>
          service.findDistribution('TICKER', new BigNumber(1))
        ).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('createDividendDistribution', () => {
    let mockAsset: MockAsset;
    const ticker = 'TICKER';
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

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
    });

    it('should run a configureDividendDistribution procedure and return the created Dividend Distribution', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.corporateAction.InitiateCorporateActionAndDistribute,
      };
      const mockTransaction = new MockTransaction(transaction);
      const mockDistribution = new MockDistribution();
      mockTransactionsService.submit.mockResolvedValue({
        result: mockDistribution,
        transactions: [mockTransaction],
      });

      const result = await service.createDividendDistribution(ticker, body);

      expect(result).toEqual({
        result: mockDistribution,
        transactions: [mockTransaction],
      });
      expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
    });
  });

  describe('remove', () => {
    let mockAsset: MockAsset;
    const ticker = 'TICKER';

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
    });

    it('should run a remove procedure and return the delete the Corporate Action', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.corporateAction.RemoveCa,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.remove(ticker, new BigNumber(1), { signer });

      expect(result).toEqual({
        transactions: [mockTransaction],
      });
      expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
    });
  });

  describe('payDividends', () => {
    it('should call the pay procedure and return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.capitalDistribution.PushBenefit,
      };
      const mockTransaction = new MockTransaction(transaction);

      const distributionWithDetails = new MockDistributionWithDetails();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findDistributionSpy = jest.spyOn(service, 'findDistribution');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

      const body = {
        signer,
        targets: ['0x6'.padEnd(66, '1')],
      };

      const result = await service.payDividends('TICKER', new BigNumber(1), body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        distributionWithDetails.distribution.pay,
        {
          targets: body.targets,
        },
        {
          signer,
        }
      );
      findDistributionSpy.mockRestore();
    });
  });

  describe('linkDocuments', () => {
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

    it('should run the linkDocuments procedure and return the queue results', async () => {
      const mockDistributionWithDetails = new MockDistributionWithDetails();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.corporateAction.LinkCaDoc,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockDistributionWithDetails.distribution.linkDocuments.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findDistributionSpy = jest.spyOn(service, 'findDistribution');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findDistributionSpy.mockResolvedValue(mockDistributionWithDetails as any);

      const result = await service.linkDocuments('TICKER', new BigNumber(1), body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      findDistributionSpy.mockRestore();
    });
  });

  describe('claimDividends', () => {
    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transaction = {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.capitalDistribution.Claim,
        };
        const mockTransaction = new MockTransaction(transaction);

        const distributionWithDetails = new MockDistributionWithDetails();
        distributionWithDetails.distribution.claim.mockResolvedValue(mockTransaction);
        mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

        const result = await service.claimDividends('TICKER', new BigNumber(1), { signer });
        expect(result).toEqual({
          result: undefined,
          transactions: [mockTransaction],
        });
        expect(mockTransactionsService.submit).toHaveBeenCalledWith(
          distributionWithDetails.distribution.claim,
          undefined,
          {
            signer,
          }
        );
        findDistributionSpy.mockRestore();
      });
    });
  });

  describe('reclaimRemainingFunds', () => {
    const webhookUrl = 'http://example.com';
    const dryRun = false;

    it('should call the reclaimFunds procedure and return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.capitalDistribution.Reclaim,
      };
      const mockTransaction = new MockTransaction(transaction);

      const distributionWithDetails = new MockDistributionWithDetails();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findDistributionSpy = jest.spyOn(service, 'findDistribution');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

      const result = await service.reclaimRemainingFunds('TICKER', new BigNumber(1), {
        signer,
        webhookUrl,
        dryRun,
      });
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        distributionWithDetails.distribution.reclaimFunds,
        undefined,
        { signer, webhookUrl, dryRun }
      );
      findDistributionSpy.mockRestore();
    });
  });

  describe('modifyCheckpoint', () => {
    it('should run the modifyCheckpoint procedure and return the queue results', async () => {
      const mockDistributionWithDetails = new MockDistributionWithDetails();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.corporateAction.ChangeRecordDate,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findDistributionSpy = jest.spyOn(service, 'findDistribution');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findDistributionSpy.mockResolvedValue(mockDistributionWithDetails as any);

      const body = {
        checkpoint: {
          id: new BigNumber(1),
          type: CaCheckpointType.Existing,
        },
        signer,
      };
      const result = await service.modifyCheckpoint('TICKER', new BigNumber(1), body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      findDistributionSpy.mockRestore();
    });
  });
});
