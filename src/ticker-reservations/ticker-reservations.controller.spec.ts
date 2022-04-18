import { Test, TestingModule } from '@nestjs/testing';
import { TickerReservationStatus } from '@polymathnetwork/polymesh-sdk/types';

import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { MockAuthorizationRequest, MockIdentity, MockTickerReservation } from '~/test-utils/mocks';
import { MockTickerReservationsService } from '~/test-utils/service-mocks';
import { TickerReservationsController } from '~/ticker-reservations/ticker-reservations.controller';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';

describe('TickerReservationsController', () => {
  let controller: TickerReservationsController;

  const mockTickerReservationsService = new MockTickerReservationsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TickerReservationsController],
      providers: [TickerReservationsService],
    })
      .overrideProvider(TickerReservationsService)
      .useValue(mockTickerReservationsService)
      .compile();

    controller = module.get<TickerReservationsController>(TickerReservationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('reserve', () => {
    it('should call the service and return the results', async () => {
      mockTickerReservationsService.reserve.mockResolvedValue({ transactions: ['transaction'] });

      const ticker = 'SOME_TICKER';
      const signer = '0x6000';
      const result = await controller.reserve({ ticker }, { signer });

      expect(result).toEqual({
        transactions: ['transaction'],
      });
      expect(mockTickerReservationsService.reserve).toHaveBeenCalledWith(ticker, signer);
    });
  });

  describe('transferOwnership', () => {
    it('should call the service and return the results', async () => {
      const mockAuthorization = new MockAuthorizationRequest();
      const mockData = {
        result: mockAuthorization,
        transactions: ['transaction'],
      };
      mockTickerReservationsService.transferOwnership.mockResolvedValue(mockData);

      const body = { signer: '0x6000', target: '0x1000' };
      const ticker = 'SOME_TICKER';

      const result = await controller.transferOwnership({ ticker }, body);

      expect(result).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
        transactions: ['transaction'],
      });
      expect(mockTickerReservationsService.transferOwnership).toHaveBeenCalledWith(ticker, body);
    });
  });

  describe('extendReservation', () => {
    it('should call the service and return the results', async () => {
      const mockDate = new Date();
      const mockResult = {
        owner: new MockIdentity(),
        expiryDate: mockDate,
        status: TickerReservationStatus.Reserved,
      };

      const mockTickerReservation = new MockTickerReservation();
      mockTickerReservation.details.mockResolvedValue(mockResult);

      const mockData = {
        result: mockTickerReservation,
        transactions: ['transaction'],
      };
      mockTickerReservationsService.extend.mockResolvedValue(mockData);

      const signer = '0x6000';
      const ticker = 'SOME_TICKER';

      const result = await controller.extendReservation({ ticker }, { signer });

      expect(result).toEqual({
        tickerReservation: mockResult,
        transactions: ['transaction'],
      });
      expect(mockTickerReservationsService.extend).toHaveBeenCalledWith(ticker, signer);
    });
  });
});
