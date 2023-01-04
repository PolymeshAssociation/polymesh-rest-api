/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import {
  MockAuthorizationRequest,
  MockPolymesh,
  MockTickerReservation,
  MockTransaction,
} from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('TickerReservationsService', () => {
  let service: TickerReservationsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;
  const { signer } = testValues;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockTransactionsService = mockTransactionsProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [TickerReservationsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    polymeshService = module.get<PolymeshService>(PolymeshService);
    service = module.get<TickerReservationsService>(TickerReservationsService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return the reservation', async () => {
      const mockTickerReservation = new MockTickerReservation();
      mockPolymeshApi.assets.getTickerReservation.mockResolvedValue(mockTickerReservation);

      const result = await service.findOne('TICKER');
      expect(result).toEqual(mockTickerReservation);
    });
  });

  describe('reserve', () => {
    const ticker = 'TICKER';

    it('should run a reserveTicker procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.RegisterTicker,
      };
      const mockResult = new MockTickerReservation();

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        result: mockResult,
        transactions: [mockTransaction],
      });

      const result = await service.reserve(ticker, { signer });
      expect(result).toEqual({
        result: mockResult,
        transactions: [mockTransaction],
      });
    });
  });

  describe('transferOwnership', () => {
    const ticker = 'TICKER';
    const body = {
      signer: '0x6000',
      target: '0x1000',
      expiry: new Date(),
    };
    let mockTickerReservation: MockTickerReservation;

    beforeEach(() => {
      mockTickerReservation = new MockTickerReservation();
    });

    it('should run a transferOwnership procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.AddAuthorization,
      };
      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockTickerReservation as any);

      const mockResult = new MockAuthorizationRequest();

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        result: mockResult,
        transactions: [mockTransaction],
      });
      mockTickerReservation.transferOwnership.mockResolvedValue(mockTransaction);

      const result = await service.transferOwnership(ticker, body);
      expect(result).toEqual({
        result: mockResult,
        transactions: [mockTransaction],
      });
    });
  });

  describe('extend', () => {
    const ticker = 'TICKER';
    let mockTickerReservation: MockTickerReservation;

    beforeEach(() => {
      mockTickerReservation = new MockTickerReservation();
    });

    it('should run a extend procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.RegisterTicker,
      };

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockTickerReservation as any);

      const mockResult = new MockTickerReservation();

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        result: mockResult,
        transactions: [mockTransaction],
      });

      const result = await service.extend(ticker, { signer });
      expect(result).toEqual({
        result: mockResult,
        transactions: [mockTransaction],
      });
    });
  });

  describe('findAllByOwner', () => {
    it('should return the list of TickerReservations', async () => {
      const mockTickerReservation = new MockTickerReservation();
      mockPolymeshApi.assets.getTickerReservations.mockResolvedValue([mockTickerReservation]);

      const result = await service.findAllByOwner('0x6000');
      expect(result).toEqual([mockTickerReservation]);
    });
  });
});
