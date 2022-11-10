import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ResultsModel } from '~/common/models/results.model';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { PortfoliosController } from '~/portfolios/portfolios.controller';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { createPortfolioModel } from '~/portfolios/portfolios.util';
import { testDid, testSigner as signer } from '~/test-utils/consts';
import { MockPortfolio } from '~/test-utils/mocks';
import { MockPortfoliosService } from '~/test-utils/service-mocks';

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
      const did = testDid;
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
      const response = { transactions: ['transaction'] };
      mockPortfoliosService.moveAssets.mockResolvedValue(response);
      const params = {
        signer: '0x6000',
        to: new BigNumber(2),
        from: new BigNumber(0),
        items: [{ to: '3', ticker: 'TICKER', amount: new BigNumber(100) }],
      };

      const result = await controller.moveAssets({ did: '0x6000' }, params);

      expect(result).toEqual({ transactions: ['transaction'] });
    });
  });

  describe('createPortfolio', () => {
    it('should return the transaction details', async () => {
      const mockPortfolio = new MockPortfolio();
      const response = {
        result: mockPortfolio,
        transactions: ['transaction'],
      };
      mockPortfoliosService.createPortfolio.mockResolvedValue(response);
      const params = {
        signer: '0x06'.padEnd(66, '0'),
        name: 'FOLIO-1',
      };

      const result = await controller.createPortfolio(params);

      expect(result).toEqual({
        portfolio: {
          id: '1',
          did: '0x06'.padEnd(66, '0'),
        },
        transactions: ['transaction'],
      });
    });
  });

  describe('deletePortfolio', () => {
    it('should return the transaction details', async () => {
      const response = {
        transactions: ['transaction'],
      };
      mockPortfoliosService.deletePortfolio.mockResolvedValue(response);

      const result = await controller.deletePortfolio(
        new PortfolioDto({ id: new BigNumber(1), did: testDid }),
        { signer }
      );

      expect(result).toEqual({
        transactions: ['transaction'],
      });
    });
  });
});
