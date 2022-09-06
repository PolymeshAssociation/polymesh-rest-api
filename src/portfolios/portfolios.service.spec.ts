/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ErrorCode, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { MockIdentity, MockPolymesh, MockPortfolio, MockTransaction } from '~/test-utils/mocks';
import {
  MockIdentitiesService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
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
    mockIsPolymeshError.mockReset();
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
      const did = '0x6'.padEnd(66, '0');
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
    describe('if the Portfolio does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockIdentity = new MockIdentity();
        const owner = '0x6000';

        const mockError = {
          code: ErrorCode.ValidationError,
          message: "The Portfolio doesn't exist",
        };
        mockIdentity.portfolios.getPortfolio.mockImplementation(() => {
          throw mockError;
        });

        mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne(owner, new BigNumber(1));
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });

    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('foo');
        const mockIdentity = new MockIdentity();
        const owner = '0x6000';
        mockIdentity.portfolios.getPortfolio.mockImplementation(() => {
          throw expectedError;
        });

        mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

        mockIsPolymeshError.mockReturnValue(false);

        let error;
        try {
          await service.findOne(owner, new BigNumber(2));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });

    describe('otherwise', () => {
      it('should return the portfolio', async () => {
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
        { signer: '0x6000' }
      );
      findOneSpy.mockRestore();
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

        const signer = '0x6'.padEnd(66, '0');
        const portfolio = new PortfolioDto({
          id: new BigNumber(1),
          did: '0x6'.padEnd(66, '0'),
        });

        mockTransactionsService.submit.mockResolvedValue({
          result: undefined,
          transactions: [mockTransaction],
        });

        const result = await service.deletePortfolio(portfolio, signer);
        expect(result).toEqual({
          result: undefined,
          transactions: [mockTransaction],
        });
      });
    });
  });
});
