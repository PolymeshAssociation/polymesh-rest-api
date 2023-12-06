/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AllowanceOperation, Subsidy, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AccountsService } from '~/accounts/accounts.service';
import { AppValidationError } from '~/common/errors';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { ModifyAllowanceDto } from '~/subsidy/dto/modify-allowance.dto';
import { QuitSubsidyDto } from '~/subsidy/dto/quit-subsidy.dto';
import { SubsidyService } from '~/subsidy/subsidy.service';
import { testValues } from '~/test-utils/consts';
import {
  createMockSubsidy,
  MockAccount,
  MockAuthorizationRequest,
  MockPolymesh,
  MockTransaction,
} from '~/test-utils/mocks';
import {
  MockAccountsService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';
import * as transactionsUtilModule from '~/transactions/transactions.util';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('SubsidyService', () => {
  let service: SubsidyService;
  let mockAccountsService: MockAccountsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;
  let beneficiary: string;
  let subsidizer: string;
  let allowance: BigNumber;
  let signer: string;
  let mockSubsidy: DeepMocked<Subsidy>;

  beforeEach(async () => {
    ({ signer } = testValues);
    beneficiary = 'beneficiary';
    subsidizer = 'subsidizer';
    allowance = new BigNumber(100);

    mockPolymeshApi = new MockPolymesh();
    mockSubsidy = createMockSubsidy();

    mockTransactionsService = mockTransactionsProvider.useValue;
    mockAccountsService = new MockAccountsService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [SubsidyService, AccountsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(AccountsService)
      .useValue(mockAccountsService)
      .compile();

    service = module.get<SubsidyService>(SubsidyService);
    polymeshService = module.get<PolymeshService>(PolymeshService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubsidy', () => {
    it('should return the Account Subsidy', async () => {
      const mockSubsidyWithAllowance = {
        subsidy: mockSubsidy,
        allowance: new BigNumber(10),
      };

      const mockAccount = new MockAccount();
      mockAccount.getSubsidy.mockResolvedValue(mockSubsidyWithAllowance);

      when(mockAccountsService.findOne).calledWith(subsidizer).mockResolvedValue(mockAccount);

      const result = await service.getSubsidy(subsidizer);

      expect(result).toEqual(mockSubsidyWithAllowance);
    });
  });

  describe('findOne', () => {
    it('should return a Subsidy instance for a given beneficiary and subsidizer', () => {
      when(mockPolymeshApi.accountManagement.getSubsidy)
        .calledWith({ beneficiary, subsidizer })
        .mockReturnValue(mockSubsidy);

      const result = service.findOne(beneficiary, subsidizer);

      expect(result).toEqual(mockSubsidy);
    });
  });

  describe('subsidizeAccount', () => {
    it('should run a subsidizeAccount procedure and return the queue results', async () => {
      const mockAuthRequest = new MockAuthorizationRequest();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.relayer.SetPayingKey,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockAuthRequest,
        transactions: [mockTransaction],
      });

      const body = {
        signer,
        beneficiary,
        allowance: new BigNumber(100),
      };

      const result = await service.subsidizeAccount(body);
      expect(result).toEqual({
        result: mockAuthRequest,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.accountManagement.subsidizeAccount,
        { beneficiary, allowance },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('quit', () => {
    it('should run a quit procedure and return the queue results', async () => {
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.relayer.RemovePayingKey,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const findOneSpy = jest.spyOn(service, 'findOne');

      when(findOneSpy).calledWith(beneficiary, subsidizer).mockReturnValue(mockSubsidy);

      mockTransactionsService.getSigningAccount.mockResolvedValueOnce(subsidizer);

      mockTransactionsService.submit.mockResolvedValue({
        transactions: [mockTransaction],
      });

      let body = {
        signer: subsidizer,
        beneficiary,
      } as QuitSubsidyDto;

      let result = await service.quit(body);
      expect(result).toEqual({
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockSubsidy.quit,
        {},
        expect.objectContaining({ signer: subsidizer })
      );

      when(findOneSpy).calledWith(subsidizer, beneficiary).mockReturnValue(mockSubsidy);

      mockTransactionsService.getSigningAccount.mockResolvedValueOnce(beneficiary);

      body = {
        signer: beneficiary,
        subsidizer,
      };

      result = await service.quit(body);
      expect(result).toEqual({
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockSubsidy.quit,
        {},
        expect.objectContaining({ signer: beneficiary })
      );
    });

    it('should throw an error if no beneficiary or subsidizer is passed', () => {
      mockTransactionsService.getSigningAccount.mockResolvedValueOnce('address');

      return expect(() => service.quit({ signer: 'signer' })).rejects.toBeInstanceOf(
        AppValidationError
      );
    });

    it('should throw an error if both beneficiary and subsidizer are passed', () => {
      mockTransactionsService.getSigningAccount.mockResolvedValueOnce('address');

      return expect(() =>
        service.quit({ signer: 'signer', beneficiary, subsidizer })
      ).rejects.toBeInstanceOf(AppValidationError);
    });
  });

  describe('modifyAllowance', () => {
    let findOneSpy: jest.SpyInstance;
    let body: ModifyAllowanceDto;
    let mockTransaction: MockTransaction;

    beforeEach(() => {
      body = {
        signer,
        beneficiary,
        allowance,
      };

      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.relayer.RemovePayingKey,
      };
      mockTransaction = new MockTransaction(mockTransactions);

      mockTransactionsService.submit.mockResolvedValue({
        transactions: [mockTransaction],
      });

      mockTransactionsService.getSigningAccount.mockResolvedValue(subsidizer);

      findOneSpy = jest.spyOn(service, 'findOne');
      when(findOneSpy).calledWith(beneficiary, subsidizer).mockReturnValue(mockSubsidy);
    });

    it('should run a setAllowance procedure and return the queue results', async () => {
      const result = await service.modifyAllowance(body, AllowanceOperation.Set);
      expect(result).toEqual({
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockSubsidy.setAllowance,
        { allowance },
        expect.objectContaining({ signer })
      );
    });

    it('should run a increaseAllowance procedure and return the queue results', async () => {
      const result = await service.modifyAllowance(body, AllowanceOperation.Increase);
      expect(result).toEqual({
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockSubsidy.increaseAllowance,
        { allowance },
        expect.objectContaining({ signer })
      );
    });

    it('should run a decreaseAllowance procedure and return the queue results', async () => {
      const result = await service.modifyAllowance(body, AllowanceOperation.Decrease);
      expect(result).toEqual({
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockSubsidy.decreaseAllowance,
        { allowance },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('getAllowance', () => {
    let findOneSpy: jest.SpyInstance;

    beforeEach(() => {
      findOneSpy = jest.spyOn(service, 'findOne');

      when(findOneSpy).calledWith(beneficiary, subsidizer).mockReturnValue(mockSubsidy);
    });

    it('should return the Subsidy allowance', async () => {
      mockSubsidy.getAllowance.mockResolvedValue(allowance);

      const result = await service.getAllowance(beneficiary, subsidizer);

      expect(result).toEqual(allowance);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockSubsidy.getAllowance.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.getAllowance(beneficiary, subsidizer)).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });
});
