/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { ErrorCode, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { IdentitiesService } from '~/identities/identities.service';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockIdentity,
  MockPortfolio,
  MockRelayerAccountsService,
  MockTransactionQueue,
} from '~/test-utils/mocks';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('PortfoliosService', () => {
  let service: PortfoliosService;
  const mockIdentitiesService = {
    findOne: jest.fn(),
  };
  const mockRelayerAccountsService = new MockRelayerAccountsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfoliosService, IdentitiesService, RelayerAccountsService],
    })
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get<PortfoliosService>(PortfoliosService);
  });

  afterAll(() => {
    mockIsPolymeshError.mockReset();
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
          tokenBalances: [
            {
              ticker: 'TICKER',
            },
          ],
        },
        {
          id: new BigNumber(1),
          name: 'TEST',
          tokenBalances: [],
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
        mockIdentity.portfolios.getPortfolio.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.ValidationError,
            message: "The Portfolio doesn't exist",
          });
        });
        mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
        mockIsPolymeshError.mockResolvedValue(true);
        let error;
        try {
          await service.findOne(owner, new BigNumber('1'));
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
          await service.findOne(owner, new BigNumber('2'));
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
          tokenBalances: [],
        };
        const owner = '0x6000';
        mockIdentity.portfolios.getPortfolio.mockResolvedValue(mockPortfolio);
        mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
        const result = await service.findOne(owner, new BigNumber('1'));
        expect(result).toEqual({
          id: new BigNumber('1'),
          name: 'Growth',
          tokenBalances: [],
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
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.portfolio.MovePortfolioFunds,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockPortfolio.moveFunds.mockResolvedValue(mockQueue);

      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
      const body = {
        signer: '0x6000',
        to: new BigNumber('2'),
        from: new BigNumber('0'),
        items: [
          {
            ticker: 'TICKER',
            amount: new BigNumber('123'),
          },
        ],
      };

      const result = await service.moveAssets('0x6000', body);
      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.portfolio.MovePortfolioFunds,
          },
        ],
      });
      expect(mockPortfolio.moveFunds).toHaveBeenCalledWith(
        {
          to: new BigNumber('2'),
          items: [
            {
              amount: new BigNumber('123'),
              token: 'TICKER',
              memo: undefined,
            },
          ],
        },
        { signer: address }
      );
      findOneSpy.mockRestore();
    });
  });
});
