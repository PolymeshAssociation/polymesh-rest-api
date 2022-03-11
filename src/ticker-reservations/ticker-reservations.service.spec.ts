/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { GoneException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ErrorCode, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionType } from '~/common/types';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockAuthorizationRequest,
  MockPolymesh,
  MockTickerReservation,
  MockTransactionQueue,
} from '~/test-utils/mocks';
import { MockRelayerAccountsService } from '~/test-utils/service-mocks';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('TickerReservationsService', () => {
  let service: TickerReservationsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockRelayerAccountsService: MockRelayerAccountsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockRelayerAccountsService = new MockRelayerAccountsService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, RelayerAccountsModule],
      providers: [TickerReservationsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
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
    describe('if the reservation does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          message: 'There is no reservation for',
          code: ErrorCode.UnmetPrerequisite,
        };
        mockPolymeshApi.assets.getTickerReservation.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne('BRK.A');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if the asset has already been created', () => {
      it('should throw a GoneException', async () => {
        const mockError = {
          code: ErrorCode.UnmetPrerequisite,
          message: 'BRK.A Asset has been created',
        };
        mockPolymeshApi.assets.getTickerReservation.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne('BRK.A');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(GoneException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('Something else');
        mockPolymeshApi.assets.getTickerReservation.mockImplementation(() => {
          throw expectedError;
        });
        mockIsPolymeshError.mockReturnValue(true);
        let error;
        try {
          await service.findOne('BRK.A');
        } catch (err) {
          error = err;
        }
        expect(error).toBe(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return the reservation', async () => {
        const mockTickerReservation = new MockTickerReservation();
        mockPolymeshApi.assets.getTickerReservation.mockResolvedValue(mockTickerReservation);

        const result = await service.findOne('BRK.A');
        expect(result).toEqual(mockTickerReservation);
      });
    });
  });

  describe('reserve', () => {
    const ticker = 'TICKER';
    const signer = '0x6000';

    beforeEach(() => {
      mockRelayerAccountsService.findAddressByDid.mockReturnValue('address');
    });

    describe('if there is an error while reserving the ticker', () => {
      it('should pass it up the chain', async () => {
        const expectedError = new Error('Some error');

        mockPolymeshApi.assets.reserveTicker.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          await service.reserve(ticker, signer);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });

    describe('otherwise', () => {
      it('should run a reserveTicker procedure and return the queue data', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.asset.RegisterTicker,
          },
        ];
        const mockResult = new MockTickerReservation();

        const mockQueue = new MockTransactionQueue(transactions);
        mockQueue.run.mockResolvedValue(mockResult);
        mockPolymeshApi.assets.reserveTicker.mockResolvedValue(mockQueue);

        const result = await service.reserve(ticker, signer);
        expect(result).toEqual({
          result: mockResult,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.asset.RegisterTicker,
              type: TransactionType.Single,
            },
          ],
        });
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
      mockRelayerAccountsService.findAddressByDid.mockReturnValue('address');
    });

    describe('if there is an error while transferring the ownership of the ticker', () => {
      it('should pass it up the chain', async () => {
        const expectedError = new Error('Some error');

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockTickerReservation as any);

        mockTickerReservation.transferOwnership.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          await service.transferOwnership(ticker, body);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
        findOneSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should run a transferOwnership procedure and return the queue data', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.identity.AddAuthorization,
          },
        ];

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockTickerReservation as any);

        const mockResult = new MockAuthorizationRequest();

        const mockQueue = new MockTransactionQueue(transactions);
        mockQueue.run.mockResolvedValue(mockResult);
        mockTickerReservation.transferOwnership.mockResolvedValue(mockQueue);

        const result = await service.transferOwnership(ticker, body);
        expect(result).toEqual({
          result: mockResult,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.identity.AddAuthorization,
              type: TransactionType.Single,
            },
          ],
        });
        findOneSpy.mockRestore();
      });
    });
  });

  describe('extend', () => {
    const ticker = 'TICKER';
    const signer = '0x6000';
    let mockTickerReservation: MockTickerReservation;

    beforeEach(() => {
      mockTickerReservation = new MockTickerReservation();
      mockRelayerAccountsService.findAddressByDid.mockReturnValue('address');
    });

    describe('if there is an error while transferring the ownership of the ticker', () => {
      it('should pass it up the chain', async () => {
        const expectedError = new Error('Some error');

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockTickerReservation as any);

        mockTickerReservation.extend.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          await service.extend(ticker, signer);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
        findOneSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should run a extend procedure and return the queue data', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.asset.RegisterTicker,
          },
        ];

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockTickerReservation as any);

        const mockResult = new MockTickerReservation();

        const mockQueue = new MockTransactionQueue(transactions);
        mockQueue.run.mockResolvedValue(mockResult);
        mockTickerReservation.extend.mockResolvedValue(mockQueue);

        const result = await service.extend(ticker, signer);
        expect(result).toEqual({
          result: mockResult,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.asset.RegisterTicker,
              type: TransactionType.Single,
            },
          ],
        });
        findOneSpy.mockRestore();
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
