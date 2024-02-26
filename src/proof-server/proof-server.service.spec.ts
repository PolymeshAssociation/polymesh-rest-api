/* eslint-disable import/first */
const mockLastValueFrom = jest.fn();

import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { AppConfigError } from '~/common/errors';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import proofServerConfig from '~/proof-server/config/proof-server.config';
import { ProofServerService } from '~/proof-server/proof-server.service';
import { MockHttpService } from '~/test-utils/service-mocks';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  lastValueFrom: mockLastValueFrom,
}));

describe('ProofServerService', () => {
  let service: ProofServerService;
  let mockHttpService: MockHttpService;
  const proofServerApi = 'https://some-api.com/api/v1';

  beforeEach(async () => {
    mockHttpService = new MockHttpService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProofServerService,
        HttpService,
        mockPolymeshLoggerProvider,
        {
          provide: proofServerConfig.KEY,
          useValue: { proofServerApi },
        },
      ],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    service = module.get<ProofServerService>(ProofServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfidentialAccounts', () => {
    it('should throw an error if proof server API is not initialized', async () => {
      const incorrectModule: TestingModule = await Test.createTestingModule({
        providers: [
          ProofServerService,
          HttpService,
          mockPolymeshLoggerProvider,
          {
            provide: proofServerConfig.KEY,
            useValue: { proofServerApi: '' },
          },
        ],
      })
        .overrideProvider(HttpService)
        .useValue(mockHttpService)
        .compile();

      const incorrectService = incorrectModule.get<ProofServerService>(ProofServerService);

      const expectedError = new AppConfigError('PROOF_SERVER_API', 'Proof server not initialized');
      await expect(incorrectService.getConfidentialAccounts()).rejects.toThrow(expectedError);

      expect(mockHttpService.request).not.toHaveBeenCalled();
    });

    it('should throw an error if status is not OK', async () => {
      mockLastValueFrom.mockReturnValue({
        status: 400,
      });

      await expect(service.getConfidentialAccounts()).rejects.toThrow(
        'Proof server responded with non-OK status: 400'
      );

      expect(mockHttpService.request).toHaveBeenCalledWith({
        url: `${proofServerApi}/accounts`,
        method: 'GET',
        timeout: 10000,
      });
    });

    it('should return all the confidential accounts from proof server', async () => {
      const mockResult = [
        {
          confidential_account: 'SOME_PUBLIC_KEY',
        },
      ];
      mockLastValueFrom.mockReturnValue({
        status: 200,
        data: mockResult,
      });

      const result = await service.getConfidentialAccounts();

      expect(mockHttpService.request).toHaveBeenCalledWith({
        url: `${proofServerApi}/accounts`,
        method: 'GET',
        timeout: 10000,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('createConfidentialAccount', () => {
    it('should return create a new confidential account in proof server', async () => {
      const mockResult = {
        confidential_account: 'SOME_PUBLIC_KEY',
      };

      mockLastValueFrom.mockReturnValue({
        status: 200,
        data: mockResult,
      });

      const result = await service.createConfidentialAccount();

      expect(mockHttpService.request).toHaveBeenCalledWith({
        url: `${proofServerApi}/accounts`,
        method: 'POST',
        data: {},
        timeout: 10000,
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('generateSenderProof', () => {
    it('should return generated sender proof', async () => {
      const mockResult = 'some_proof';

      mockLastValueFrom.mockReturnValue({
        status: 200,
        data: mockResult,
      });

      const mockSenderInfo = {
        amount: 100,
        auditors: ['auditor'],
        receiver: 'receiver',
        encrypted_balance: '0xencrypted_balance',
      };

      const result = await service.generateSenderProof('confidential_account', mockSenderInfo);

      expect(mockHttpService.request).toHaveBeenCalledWith({
        url: `${proofServerApi}/accounts/confidential_account/send`,
        method: 'POST',
        data: mockSenderInfo,
        timeout: 10000,
      });

      expect(result).toEqual(mockResult);
    });
  });
});
