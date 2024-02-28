/* eslint-disable import/first */
const mockLastValueFrom = jest.fn();

import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ConfidentialProofsService } from '~/confidential-proofs/confidential-proofs.service';
import confidentialProofsConfig from '~/confidential-proofs/config/confidential-proofs.config';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { MockHttpService } from '~/test-utils/service-mocks';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  lastValueFrom: mockLastValueFrom,
}));

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
        encryptedBalance: '0xencryptedBalance',
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

  describe('verifySenderProofAsAuditor', () => {
    it('should return verify sender proof as an auditor', async () => {
      mockLastValueFrom.mockReturnValue({
        status: 200,
        data: {
          is_valid: 'true',
          amount: 10,
          errMsg: null,
        },
      });

      const result = await service.verifySenderProofAsAuditor('confidential_account', {
        amount: new BigNumber(10),
        auditorId: new BigNumber(1),
        senderProof: '0xsomeproof',
      });

      expect(mockHttpService.request).toHaveBeenCalledWith({
        url: `${proofServerUrl}/accounts/confidential_account/auditor_verify`,
        method: 'POST',
        data: {
          amount: 10,
          auditorId: 1,
          sender_proof: '0xsomeproof',
        },
        timeout: 10000,
      });

      expect(result).toEqual({
        isValid: true,
        amount: new BigNumber(10),
        errMsg: null,
      });
    });
  });

  describe('verifySenderProofAsReceiver', () => {
    it('should return verify sender proof as an auditor', async () => {
      mockLastValueFrom.mockReturnValue({
        status: 200,
        data: {
          is_valid: 'true',
          amount: 100,
          errMsg: null,
        },
      });

      const result = await service.verifySenderProofAsReceiver('confidential_account', {
        amount: new BigNumber(10),
        senderProof: '0xsomeproof',
      });

      expect(mockHttpService.request).toHaveBeenCalledWith({
        url: `${proofServerUrl}/accounts/confidential_account/receiver_verify`,
        method: 'POST',
        data: {
          amount: 10,
          sender_proof: '0xsomeproof',
        },
        timeout: 10000,
      });

      expect(result).toEqual({
        isValid: true,
        amount: new BigNumber(100),
        errMsg: null,
      });
    });
  });
});
