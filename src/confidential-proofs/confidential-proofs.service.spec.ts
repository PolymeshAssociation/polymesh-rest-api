/* eslint-disable import/first */
const mockLastValueFrom = jest.fn();

import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfidentialProofsService } from '~/confidential-proofs/confidential-proofs.service';
import confidentialProofsConfig from '~/confidential-proofs/config/confidential-proofs.config';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { MockHttpService } from '~/test-utils/service-mocks';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  lastValueFrom: mockLastValueFrom,
}));

jest.mock('axios-case-converter');

describe('ConfidentialProofsService', () => {
  let service: ConfidentialProofsService;
  let mockHttpService: MockHttpService;
  const proofServerUrl = 'https://some-api.com/api/v1';

  beforeEach(async () => {
    mockHttpService = new MockHttpService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfidentialProofsService,
        HttpService,
        mockPolymeshLoggerProvider,
        {
          provide: confidentialProofsConfig.KEY,
          useValue: { proofServerUrl },
        },
      ],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    service = module.get<ConfidentialProofsService>(ConfidentialProofsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfidentialAccounts', () => {
    it('should throw an error if status is not OK', async () => {
      mockLastValueFrom.mockReturnValue({
        status: 400,
      });

      await expect(service.getConfidentialAccounts()).rejects.toThrow(
        'Proof server responded with non-OK status: 400'
      );

      expect(mockHttpService.request).toHaveBeenCalledWith({
        url: `${proofServerUrl}/accounts`,
        method: 'GET',
        timeout: 10000,
      });
    });

    it('should return all the Confidential Accounts from proof server', async () => {
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
        url: `${proofServerUrl}/accounts`,
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
        url: `${proofServerUrl}/accounts`,
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
        url: `${proofServerUrl}/accounts/confidential_account/send`,
        method: 'POST',
        data: mockSenderInfo,
        timeout: 10000,
      });

      expect(result).toEqual(mockResult);
    });
  });
});
