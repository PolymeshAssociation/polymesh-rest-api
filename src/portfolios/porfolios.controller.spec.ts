import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { SetCustodianDto } from '~/portfolios/dto/set-custodian.dto';
import { HistoricSettlementModel } from '~/portfolios/models/historic-settlement.model';
import { PortfoliosController } from '~/portfolios/portfolios.controller';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { createPortfolioIdentifierModel, createPortfolioModel } from '~/portfolios/portfolios.util';
import { processedTxResult, testValues } from '~/test-utils/consts';
import {
  createMockResultSet,
  MockAsset,
  MockHistoricSettlement,
  MockPortfolio,
} from '~/test-utils/mocks';
import { MockPortfoliosService } from '~/test-utils/service-mocks';

const { did, signer, txResult, assetId } = testValues;

describe('PortfoliosController', () => {
  let controller: PortfoliosController;
  const mockPortfoliosService = new MockPortfoliosService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfoliosController],
      providers: [PortfoliosService, mockPolymeshLoggerProvider],
    })
      .overrideProvider(PortfoliosService)
      .useValue(mockPortfoliosService)
      .compile();

    controller = module.get<PortfoliosController>(PortfoliosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPortfolios', () => {
    it('should return list of all portfolios of an identity', async () => {
      const mockPortfolio = new MockPortfolio();
      mockPortfolio.getAssetBalances.mockResolvedValue([]);
      mockPortfolio.getCustodian.mockResolvedValue({ did });
      mockPortfolio.getName.mockResolvedValue('P-1');
      mockPortfoliosService.findAllByOwner.mockResolvedValue([mockPortfolio]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockDetails = await createPortfolioModel(mockPortfolio as any, did);

      const result = await controller.getPortfolios({ did });

      expect(result).toEqual(new ResultsModel({ results: [mockDetails] }));
    });
  });

  describe('moveAssets', () => {
    it('should return the transaction details', async () => {
      mockPortfoliosService.moveAssets.mockResolvedValue(txResult);
      const params = {
        signer: '0x6000',
        to: new BigNumber(2),
        from: new BigNumber(0),
        items: [{ to: '3', asset: assetId, amount: new BigNumber(100) }],
      };

      const result = await controller.moveAssets({ did: '0x6000' }, params);

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('createPortfolio', () => {
    it('should return the transaction details', async () => {
      const mockPortfolio = new MockPortfolio();
      const response = {
        ...txResult,
        result: mockPortfolio,
      };
      mockPortfoliosService.createPortfolio.mockResolvedValue(response);
      const params = {
        signer,
        name: 'FOLIO-1',
      };

      const result = await controller.createPortfolio(params);

      expect(result).toEqual({
        ...processedTxResult,
        portfolio: {
          id: '1',
          did,
        },
      });
    });
  });

  describe('deletePortfolio', () => {
    it('should return the transaction details', async () => {
      mockPortfoliosService.deletePortfolio.mockResolvedValue(txResult);

      const result = await controller.deletePortfolio(
        new PortfolioDto({ id: new BigNumber(1), did }),
        { signer }
      );

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('modifyPortfolioName', () => {
    it('should return the transaction details', async () => {
      const mockPortfolio = new MockPortfolio();
      const response = {
        ...txResult,
        result: mockPortfolio,
      };
      mockPortfoliosService.updatePortfolioName.mockResolvedValue(response);

      const modifyPortfolioArgs = {
        signer,
        name: 'FOLIO-1',
      };

      const result = await controller.modifyPortfolioName(
        new PortfolioDto({ id: new BigNumber(1), did }),
        modifyPortfolioArgs
      );

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('getCustodiedPortfolios', () => {
    it('should return list of all custodied portfolios of an identity', async () => {
      const mockPortfolio = new MockPortfolio();
      mockPortfolio.getAssetBalances.mockResolvedValue([]);
      mockPortfolio.getCustodian.mockResolvedValue({ did });
      mockPortfolio.getName.mockResolvedValue('P-1');

      mockPortfoliosService.getCustodiedPortfolios.mockResolvedValue(
        createMockResultSet([mockPortfolio])
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockDetails = createPortfolioIdentifierModel(mockPortfolio as any);

      const result = await controller.getCustodiedPortfolios(
        { did },
        { size: new BigNumber(1), start: '0' }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({ results: [mockDetails], next: '0', total: new BigNumber(1) })
      );
    });

    it('should handle undefined start parameter', async () => {
      const mockPortfolio = new MockPortfolio();
      mockPortfolio.getAssetBalances.mockResolvedValue([]);
      mockPortfolio.getCustodian.mockResolvedValue({ did });
      mockPortfolio.getName.mockResolvedValue('P-1');

      mockPortfoliosService.getCustodiedPortfolios.mockResolvedValue(
        createMockResultSet([mockPortfolio])
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockDetails = createPortfolioIdentifierModel(mockPortfolio as any);

      const result = await controller.getCustodiedPortfolios(
        { did },
        { size: new BigNumber(1), start: undefined }
      );

      expect(mockPortfoliosService.getCustodiedPortfolios).toHaveBeenCalledWith(did, {
        size: new BigNumber(1),
        start: undefined,
      });
      expect(result).toEqual(
        new PaginatedResultsModel({ results: [mockDetails], next: '0', total: new BigNumber(1) })
      );
    });
  });

  describe('getPortfolio', () => {
    it('should get the portfolio details', async () => {
      const mockPortfolio = new MockPortfolio();
      mockPortfolio.getAssetBalances.mockResolvedValue([]);
      mockPortfolio.getCustodian.mockResolvedValue({ did });
      mockPortfolio.getName.mockResolvedValue('P-1');
      mockPortfoliosService.findOne.mockResolvedValue(mockPortfolio);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockDetails = await createPortfolioModel(mockPortfolio as any, did);

      const result = await controller.getPortfolio(
        new PortfolioDto({ id: new BigNumber(mockPortfolio.id), did })
      );

      expect(result).toEqual(mockDetails);
    });
  });

  describe('setCustodian', () => {
    it('should return the transaction details', async () => {
      const response = {
        ...txResult,
      };
      mockPortfoliosService.setCustodian.mockResolvedValue(response);
      const params: SetCustodianDto = {
        target: did,
        signer,
      };

      const result = await controller.setCustodian(
        new PortfolioDto({ id: new BigNumber(1), did }),
        params
      );

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction result model', async () => {
      const mockHistoricSettlement = new MockHistoricSettlement();
      const resultSet = createMockResultSet([mockHistoricSettlement]);
      mockPortfoliosService.getTransactions.mockResolvedValue([mockHistoricSettlement]);

      const result = await controller.getTransactionHistory(
        new PortfolioDto({ id: new BigNumber(1), did }),
        {}
      );

      const settlementModelResult = resultSet.data.map(
        settlement => new HistoricSettlementModel(settlement as unknown as HistoricSettlementModel)
      );

      expect(result).toEqual({ results: settlementModelResult });
    });
  });

  describe('quitCustody', () => {
    it('should return the transaction details', async () => {
      const response = {
        ...txResult,
      };
      mockPortfoliosService.quitCustody.mockResolvedValue(response);
      const params = {
        signer,
      };

      const result = await controller.quitCustody(
        new PortfolioDto({ id: new BigNumber(1), did }),
        params
      );

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('createdAt', () => {
    it('should throw AppNotFoundError if the event details are not yet ready', () => {
      mockPortfoliosService.createdAt.mockResolvedValue(null);

      return expect(() =>
        controller.createdAt(new PortfolioDto({ id: new BigNumber(1), did }))
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    describe('otherwise', () => {
      it('should return the Portfolio creation event details', async () => {
        const eventIdentifier = {
          blockNumber: new BigNumber('2719172'),
          blockHash: 'someHash',
          blockDate: new Date('2021-06-26T01:47:45.000Z'),
          eventIndex: new BigNumber(1),
        };
        mockPortfoliosService.createdAt.mockResolvedValue(eventIdentifier);

        const result = await controller.createdAt(new PortfolioDto({ id: new BigNumber(1), did }));

        expect(result).toEqual(new EventIdentifierModel(eventIdentifier));
      });
    });
  });

  describe('preApproveAsset', () => {
    it('should return the transaction details', async () => {
      mockPortfoliosService.preApproveAsset.mockResolvedValue(txResult);

      const portfolioParams = new PortfolioDto({ id: new BigNumber(1), did });
      const body = { signer, asset: assetId };

      const result = await controller.preApproveAsset(portfolioParams, body);

      expect(result).toEqual(processedTxResult);
      expect(mockPortfoliosService.preApproveAsset).toHaveBeenCalledWith(portfolioParams, body);
    });
  });

  describe('removeAssetPreApproval', () => {
    it('should return the transaction details', async () => {
      mockPortfoliosService.removeAssetPreApproval.mockResolvedValue(txResult);

      const portfolioParams = new PortfolioDto({ id: new BigNumber(1), did });
      const body = { signer, asset: assetId };

      const result = await controller.removeAssetPreApproval(portfolioParams, body);

      expect(result).toEqual(processedTxResult);
      expect(mockPortfoliosService.removeAssetPreApproval).toHaveBeenCalledWith(
        portfolioParams,
        body
      );
    });
  });

  describe('getIsAssetPreApproved', () => {
    it('should return the asset pre-approval status', async () => {
      mockPortfoliosService.isAssetPreApproved.mockResolvedValue(true);

      const portfolioParams = new PortfolioDto({ id: new BigNumber(1), did });

      const result = await controller.getIsAssetPreApproved(portfolioParams, { asset: assetId });

      expect(result).toEqual({ asset: assetId, did, isPreApproved: true });
    });
  });

  describe('getPreApprovedAssets', () => {
    const paginatedResult = {
      data: [new MockAsset()],
      next: null,
      count: new BigNumber(1),
    };

    it('should return pre-approved assets without start value', async () => {
      mockPortfoliosService.getPreApprovedAssets.mockResolvedValue(paginatedResult);

      const portfolioParams = new PortfolioDto({ id: new BigNumber(1), did });

      const result = await controller.getPreApprovedAssets(portfolioParams, {
        size: new BigNumber(10),
      });

      expect(result).toEqual({
        total: paginatedResult.count,
        next: paginatedResult.next,
        results: [expect.objectContaining({ asset: assetId, did, isPreApproved: true })],
      });
    });

    it('should give pre-approved assets with start value', async () => {
      mockPortfoliosService.getPreApprovedAssets.mockResolvedValue(paginatedResult);

      const portfolioParams = new PortfolioDto({ id: new BigNumber(1), did });

      const result = await controller.getPreApprovedAssets(portfolioParams, {
        size: new BigNumber(10),
        start: new BigNumber(1),
      });

      expect(result).toEqual({
        total: paginatedResult.count,
        next: paginatedResult.next,
        results: [expect.objectContaining({ asset: assetId, did, isPreApproved: true })],
      });
    });
  });
});
