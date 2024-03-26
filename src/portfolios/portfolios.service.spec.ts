/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AppValidationError } from '~/common/errors';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { SetCustodianDto } from '~/portfolios/dto/set-custodian.dto';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { testValues } from '~/test-utils/consts';
import {
  createMockResultSet,
  MockHistoricSettlement,
  MockIdentity,
  MockPolymesh,
  MockPortfolio,
  MockTransaction,
} from '~/test-utils/mocks';
import {
  MockIdentitiesService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { signer, did } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('PortfoliosService', () => {
  let service: PortfoliosService;

  const mockIdentitiesService = new MockIdentitiesService();

  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockTransactionsService = mockTransactionsProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [PortfoliosService, IdentitiesService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    service = module.get<PortfoliosService>(PortfoliosService);
    polymeshService = module.get<PolymeshService>(PolymeshService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByOwner', () => {
    it('should return a list of Portfolios for a given DID', async () => {
      const mockIdentity = new MockIdentity();
      const mockPortfolios = [
        {
          name: 'Default',
          assetBalances: [
            {
              ticker: 'TICKER',
            },
          ],
        },
        {
          id: new BigNumber(1),
          name: 'TEST',
          assetBalances: [],
        },
      ];
      mockIdentity.portfolios.getPortfolios.mockResolvedValue(mockPortfolios);
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findAllByOwner(did);
      expect(result).toEqual(mockPortfolios);
    });
  });

  describe('findOne', () => {
    it('should return the Portfolio if it exists', async () => {
      const mockIdentity = new MockIdentity();
      const mockPortfolio = {
        name: 'Growth',
        id: new BigNumber(1),
        assetBalances: [],
      };
      const owner = '0x6000';
      mockIdentity.portfolios.getPortfolio.mockResolvedValue(mockPortfolio);
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findOne(owner, new BigNumber(1));
      expect(result).toEqual({
        id: new BigNumber(1),
        name: 'Growth',
        assetBalances: [],
      });
    });

    it('should return the default portfolio when given id of 0', async () => {
      const mockIdentity = new MockIdentity();
      const mockPortfolio = {
        id: new BigNumber(0),
        assetBalances: [],
      };
      const owner = '0x6000';
      mockIdentity.portfolios.getPortfolio.mockResolvedValue(mockPortfolio);
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

      const result = await service.findOne(owner, new BigNumber(0));
      expect(result).toEqual({
        id: new BigNumber(0),
        assetBalances: [],
      });
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('foo');
        const mockIdentity = new MockIdentity();
        const owner = '0x6000';
        mockIdentity.portfolios.getPortfolio.mockRejectedValue(mockError);

        mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.findOne(owner, new BigNumber(2))).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('moveAssets', () => {
    it('should run a moveFunds procedure and return the queue results', async () => {
      const findOneSpy = jest.spyOn(service, 'findOne');
      const mockPortfolio = new MockPortfolio();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockPortfolio as any);
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.portfolio.MovePortfolioFunds,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const body = {
        signer: '0x6000',
        to: new BigNumber(2),
        from: new BigNumber(0),
        items: [
          {
            ticker: 'TICKER',
            amount: new BigNumber(123),
          },
        ],
      };

      const result = await service.moveAssets('0x6000', body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPortfolio.moveFunds,
        {
          to: new BigNumber(2),
          items: [
            {
              amount: new BigNumber(123),
              asset: 'TICKER',
              memo: undefined,
            },
          ],
        },
        expect.objectContaining({ signer: '0x6000' })
      );
    });
  });

  describe('createPortfolio', () => {
    it('should create a Portfolio and return the queue results', async () => {
      const mockPortfolio = new MockPortfolio();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.portfolio.CreatePortfolio,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransaction.run.mockResolvedValue(mockPortfolio);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockPortfolio,
        transactions: [mockTransaction],
      });

      const body = {
        signer: '0x6000',
        name: 'FOLIO-1',
      };

      const result = await service.createPortfolio(body);
      expect(result).toEqual({
        result: mockPortfolio,
        transactions: [mockTransaction],
      });
    });
  });

  describe('deletePortfolio', () => {
    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transaction = {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.portfolio.DeletePortfolio,
        };
        const mockTransaction = new MockTransaction(transaction);

        const mockIdentity = new MockIdentity();
        mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
        mockIdentity.portfolios.delete.mockResolvedValue(mockTransaction);

        const portfolio = new PortfolioDto({
          id: new BigNumber(1),
          did,
        });

        mockTransactionsService.submit.mockResolvedValue({
          result: undefined,
          transactions: [mockTransaction],
        });

        const result = await service.deletePortfolio(portfolio, { signer });
        expect(result).toEqual({
          result: undefined,
          transactions: [mockTransaction],
        });
      });
    });
  });

  describe('updatePortfolioName', () => {
    it('should rename a Portfolio and return the queue results', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.portfolio.RenamePortfolio,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockIdentity = new MockIdentity();
      const modifyName = jest.fn();

      modifyName.mockReturnValue(mockTransaction);
      const mockPortfolio = new MockPortfolio();
      mockIdentity.portfolios.getPortfolio.mockResolvedValue(mockPortfolio);
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockPortfolio,
        transactions: [mockTransaction],
      });

      const portfolio = new PortfolioDto({
        id: new BigNumber(1),
        did,
      });

      const body = {
        signer,
        name: 'FOLIO-1',
      };

      const result = await service.updatePortfolioName(portfolio, body);
      expect(result).toEqual({
        result: mockPortfolio,
        transactions: [mockTransaction],
      });
    });

    it('should throw an error on Default portfolio', async () => {
      const portfolio = new PortfolioDto({
        id: new BigNumber(0),
        did,
      });

      const body = {
        signer,
        name: 'FOLIO-1',
      };

      const result = service.updatePortfolioName(portfolio, body);

      await expect(result).rejects.toBeInstanceOf(AppValidationError);
    });
  });

  describe('getCustodiedPortfolios', () => {
    it('should return a paginated list of custodied Portfolios for a given DID', async () => {
      const mockIdentity = new MockIdentity();
      const mockPortfolios = [
        {
          name: 'Default',
          assetBalances: [
            {
              ticker: 'TICKER',
            },
          ],
        },
        {
          id: new BigNumber(1),
          name: 'TEST',
          assetBalances: [],
        },
      ];
      const resultSet = createMockResultSet(mockPortfolios);

      mockIdentity.portfolios.getCustodiedPortfolios.mockResolvedValue(resultSet);
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.getCustodiedPortfolios(did, {
        size: new BigNumber(10),
        start: '0',
      });
      expect(result).toEqual(resultSet);
    });
  });

  describe('setCustodian', () => {
    it('should return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.AddAuthorization,
      };
      const mockTransaction = new MockTransaction(transaction);
      const mockPortfolio = new MockPortfolio();
      const mockIdentity = new MockIdentity();

      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockIdentity.portfolios.getPortfolio.mockResolvedValue(mockPortfolio);
      mockPortfolio.setCustodian.mockResolvedValue(mockTransaction);

      const custodianParams: SetCustodianDto = {
        target: did,
        signer,
      };

      mockTransactionsService.submit.mockResolvedValue({
        result: undefined,
        transactions: [mockTransaction],
      });

      const result = await service.setCustodian(did, mockPortfolio.id, custodianParams);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('getTransactions', () => {
    it('should return the transaction result set', async () => {
      const mockPortfolio = new MockPortfolio();
      const mockIdentity = new MockIdentity();
      const mockHistoricSettlement = new MockHistoricSettlement();

      const mockResultSet = createMockResultSet([mockHistoricSettlement]);

      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockIdentity.portfolios.getPortfolio.mockResolvedValue(mockPortfolio);
      mockPortfolio.getTransactionHistory.mockResolvedValue(mockResultSet);

      const result = await service.getTransactions(did, mockPortfolio.id);

      expect(result).toEqual(mockResultSet);
    });
  });

  describe('quitCustody', () => {
    it('should return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.RemoveAuthorization,
      };
      const mockTransaction = new MockTransaction(transaction);
      const mockPortfolio = new MockPortfolio();
      const mockIdentity = new MockIdentity();

      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockIdentity.portfolios.getPortfolio.mockResolvedValue(mockPortfolio);
      mockPortfolio.quitCustody.mockResolvedValue(mockTransaction);

      mockTransactionsService.submit.mockResolvedValue({
        result: undefined,
        transactions: [mockTransaction],
      });

      const result = await service.quitCustody(did, mockPortfolio.id, { signer });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('createdAt', () => {
    it('should throw an error if default Portfolio details are requested', () => {
      return expect(() => service.createdAt(did, new BigNumber(0))).rejects.toThrowError();
    });

    describe('otherwise', () => {
      it('should return the EventIdentifier details for a Portfolio', async () => {
        const mockResult = {
          blockNumber: new BigNumber('2719172'),
          blockHash: 'someHash',
          blockDate: new Date('2021-06-26T01:47:45.000Z'),
          eventIndex: new BigNumber(1),
        };
        const mockPortfolio = new MockPortfolio();
        mockPortfolio.createdAt.mockResolvedValue(mockResult);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(service, 'findOne').mockResolvedValue(mockPortfolio as any);
        const result = await service.createdAt(did, new BigNumber(1));
        expect(result).toEqual(mockResult);
      });
    });
  });
});
