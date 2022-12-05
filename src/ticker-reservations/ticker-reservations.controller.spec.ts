import { Test, TestingModule } from '@nestjs/testing';
import { TickerReservationStatus } from '@polymeshassociation/polymesh-sdk/types';

import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { testValues } from '~/test-utils/consts';
import { MockAuthorizationRequest, MockIdentity, MockTickerReservation } from '~/test-utils/mocks';
import { MockTickerReservationsService } from '~/test-utils/service-mocks';
import { TickerReservationsController } from '~/ticker-reservations/ticker-reservations.controller';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';

describe('TickerReservationsController', () => {
  let controller: TickerReservationsController;
  const { signer, txResult, dryRun } = testValues;
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
      mockTickerReservationsService.reserve.mockResolvedValue(txResult);

      const ticker = 'SOME_TICKER';
      const result = await controller.reserve({ ticker, signer });

      expect(result).toEqual(txResult);
      expect(mockTickerReservationsService.reserve).toHaveBeenCalledWith(ticker, { signer });
    });
  });

  describe('getDetails', () => {
    it('should call the service and return the details', async () => {
      const mockDetails = {
        owner: '0x6000',
        expiryDate: null,
        status: TickerReservationStatus.AssetCreated,
      };
      const mockTickerReservation = new MockTickerReservation();
      mockTickerReservation.details.mockResolvedValue(mockDetails);
      mockTickerReservationsService.findOne.mockResolvedValue(mockTickerReservation);

      const ticker = 'SOME_TICKER';
      const result = await controller.getDetails({ ticker });

      expect(result).toEqual(mockDetails);
      expect(mockTickerReservationsService.findOne).toHaveBeenCalledWith(ticker);
    });
  });

  describe('transferOwnership', () => {
    it('should call the service and return the results', async () => {
      const mockAuthorization = new MockAuthorizationRequest();
      const mockData = {
        ...txResult,
        result: mockAuthorization,
      };
      mockTickerReservationsService.transferOwnership.mockResolvedValue(mockData);

      const body = { signer, target: '0x1000' };
      const ticker = 'SOME_TICKER';

      const result = await controller.transferOwnership({ ticker }, body);

      expect(result).toEqual({
        ...txResult,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
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
        ...txResult,
        result: mockTickerReservation,
      };
      mockTickerReservationsService.extend.mockResolvedValue(mockData);

      const webhookUrl = 'http://example.com/webhook';
      const ticker = 'SOME_TICKER';

      const result = await controller.extendReservation({ ticker }, { signer, webhookUrl, dryRun });

      expect(result).toEqual({
        ...txResult,
        tickerReservation: mockResult,
      });
      expect(mockTickerReservationsService.extend).toHaveBeenCalledWith(ticker, {
        signer,
        webhookUrl,
        dryRun,
      });
    });
  });
});
