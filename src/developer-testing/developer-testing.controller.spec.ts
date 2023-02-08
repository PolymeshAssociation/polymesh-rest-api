import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';
import { Response } from 'express';
import { when } from 'jest-when';

import { DeveloperTestingController } from '~/developer-testing/developer-testing.controller';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { CreateTestAccountsDto } from '~/developer-testing/dto/create-test-accounts.dto';
import { CreateTestAdminsDto } from '~/developer-testing/dto/create-test-admins.dto';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';
import { testValues } from '~/test-utils/consts';
import { mockDeveloperServiceProvider } from '~/test-utils/service-mocks';

describe('DeveloperTestingController', () => {
  let controller: DeveloperTestingController;
  let mockService: DeepMocked<DeveloperTestingService>;
  const {
    testAccount: { address },
  } = testValues;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeveloperTestingController],
      providers: [mockDeveloperServiceProvider],
    }).compile();

    mockService = mockDeveloperServiceProvider.useValue as DeepMocked<DeveloperTestingService>;
    controller = module.get(DeveloperTestingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('should return an empty object', async () => {
      const mockResponse = createMock<Response>();

      await controller.handleWebhook({}, '', mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should set the header if provided', async () => {
      const mockResponse = createMock<Response>();
      const secret = 'someSecret';

      await controller.handleWebhook({}, secret, mockResponse);

      expect(mockResponse.header).toHaveBeenCalledWith(HANDSHAKE_HEADER_KEY, secret);
    });
  });

  describe('createTestingAdmins', () => {
    it('call the service with the params and return the result', async () => {
      const serviceResponse: Identity[] = [];

      const params = {
        accounts: [{ address, initialPolyx: new BigNumber(10) }],
      } as CreateTestAdminsDto;

      when(mockService.createTestAdmins).calledWith(params).mockResolvedValue(serviceResponse);

      const result = await controller.createTestAdmins(params);

      expect(result).toEqual({ results: serviceResponse });
      expect(mockService.createTestAdmins).toHaveBeenCalledWith(params);
    });
  });

  describe('createTestAccount', () => {
    it('call the service with the params and return the result', async () => {
      const serviceResponse: Identity[] = [];

      const params = {
        accounts: [{ address, initialPolyx: new BigNumber(10) }],
      } as CreateTestAccountsDto;

      when(mockService.createTestAccounts).calledWith(params).mockResolvedValue(serviceResponse);

      const result = await controller.createTestAccounts(params);

      expect(result).toEqual({ results: serviceResponse });
      expect(mockService.createTestAccounts).toHaveBeenCalledWith(params);
    });
  });
});
