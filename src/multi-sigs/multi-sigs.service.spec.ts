/* eslint-disable import/first */
const mockIsMultiSigAccount = jest.fn();

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  HistoricalMultiSigProposal,
  Identity,
  MultiSig,
  MultiSigProposal,
} from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AccountsService } from '~/accounts/accounts.service';
import { AppInternalError, AppValidationError } from '~/common/errors';
import { MultiSigsService } from '~/multi-sigs/multi-sigs.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { testValues, txResult } from '~/test-utils/consts';
import { MockIdentity, MockPolymesh } from '~/test-utils/mocks';
import { MockTransactionsService } from '~/test-utils/service-mocks';
import { TransactionsService } from '~/transactions/transactions.service';

const { options } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isMultiSigAccount: mockIsMultiSigAccount,
}));

describe('MultiSigsService', () => {
  const multiSigAddress = 'someAddress';
  const proposalId = new BigNumber(1);
  const proposalParams = { multiSigAddress, proposalId };

  let service: MultiSigsService;
  let mockAccountService: DeepMocked<AccountsService>;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;

  let multiSig: DeepMocked<MultiSig>;
  let proposal: DeepMocked<MultiSigProposal>;
  let historicalProposal: DeepMocked<HistoricalMultiSigProposal>;

  beforeEach(async () => {
    mockAccountService = createMock<AccountsService>();
    mockTransactionsService = new MockTransactionsService();

    multiSig = createMock<MultiSig>({ address: multiSigAddress });
    proposal = createMock<MultiSigProposal>({ id: proposalId });
    historicalProposal = createMock<HistoricalMultiSigProposal>({ proposal });
    mockPolymeshApi = new MockPolymesh();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [
        { provide: AccountsService, useValue: mockAccountService },
        { provide: TransactionsService, useValue: mockTransactionsService },
        MultiSigsService,
      ],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    when(mockAccountService.findOne).calledWith(multiSigAddress).mockResolvedValue(multiSig);
    when(multiSig.getProposal).calledWith({ id: proposalId }).mockResolvedValue(proposal);
    when(mockIsMultiSigAccount).calledWith(multiSig).mockReturnValue(true);
    when(mockTransactionsService.submit)
      .calledWith(expect.any(Function), expect.anything(), expect.anything())
      .mockResolvedValue(txResult);

    service = module.get<MultiSigsService>(MultiSigsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return the multiSig', async () => {
      mockIsMultiSigAccount.mockReturnValue(true);

      const result = await service.findOne(multiSigAddress);

      expect(result).toEqual(multiSig);
    });

    it('should throw an error if the account is not a multiSig', () => {
      mockAccountService.findOne.mockResolvedValue(multiSig);
      mockIsMultiSigAccount.mockReturnValue(false);

      return expect(service.findOne(multiSigAddress)).rejects.toThrow(AppValidationError);
    });
  });

  describe('findProposal', () => {
    it('should return the proposal', async () => {
      const result = await service.findProposal(proposalParams);

      expect(result).toEqual(proposal);
    });

    it('should handle an error when finding a multiSig', () => {
      const error = new Error('some find multi sig error');
      mockAccountService.findOne.mockRejectedValue(error);

      return expect(service.findProposal(proposalParams)).rejects.toThrow(AppInternalError);
    });

    it('should handle an error when finding the proposal', () => {
      const error = new Error('some get proposal error');
      multiSig.getProposal.mockRejectedValue(error);

      return expect(service.findProposal(proposalParams)).rejects.toThrow(AppInternalError);
    });
  });

  describe('create', () => {
    it('should create a multiSig', async () => {
      const multiSignerAddress = 'multiSignerAddress';
      when(mockAccountService.findOne)
        .calledWith(multiSignerAddress)
        .mockResolvedValue(createMock<Account>());

      const result = await service.create({
        requiredSignatures: new BigNumber(1),
        signers: [multiSignerAddress],
        options,
      });

      expect(result).toEqual(txResult);
    });
  });

  describe('modify', () => {
    it('should modify the multiSig', async () => {
      const multiSignerAddress = 'multiSignerAddress';

      when(mockAccountService.findOne)
        .calledWith(multiSignerAddress)
        .mockResolvedValue(createMock<Account>());

      const result = await service.modify(multiSigAddress, {
        requiredSignatures: new BigNumber(1),
        signers: [multiSignerAddress],
        options,
      });

      expect(result).toEqual(txResult);
    });
  });

  describe('approve', () => {
    it('should approve the proposal', async () => {
      const result = await service.approve(proposalParams, { options });

      expect(result).toEqual(txResult);
    });
  });

  describe('reject', () => {
    it('should reject the proposal', async () => {
      const result = await service.reject(proposalParams, { options });

      expect(result).toEqual(txResult);
    });
  });

  describe('getHistoricalProposals', () => {
    it('should return historical proposals', async () => {
      const mockResultSet = {
        data: [historicalProposal],
        next: new BigNumber(2),
        count: new BigNumber(1),
      };
      when(multiSig.getHistoricalProposals).mockResolvedValue(mockResultSet);
      const result = await service.getHistoricalProposals(multiSigAddress);

      expect(result).toEqual(mockResultSet);
    });
  });

  describe('getProposals', () => {
    it('should return active proposals', async () => {
      when(multiSig.getProposals).mockResolvedValue([proposal]);
      const result = await service.getProposals(multiSigAddress);

      expect(result).toEqual([proposal]);
    });

    it('should handle errors', () => {
      when(multiSig.getProposals).mockRejectedValue(new Error('Some error'));

      return expect(service.getProposals(multiSigAddress)).rejects.toThrow(AppInternalError);
    });
  });

  describe('removePayer', () => {
    it('should remove the payer', async () => {
      const result = await service.removePayer(multiSigAddress, { options });

      expect(result).toEqual(txResult);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        multiSig.removePayer,
        {},
        options
      );
    });
  });

  describe('setAdmin', () => {
    it('should set the admin', async () => {
      const params = { admin: 'NEW_ADMIN_DID' };
      const result = await service.setAdmin(multiSigAddress, { ...params, options });

      expect(result).toEqual(txResult);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        multiSig.setAdmin,
        params,
        options
      );
    });
  });

  describe('removeAdmin', () => {
    it('should remove the admin', async () => {
      const result = await service.removeAdmin(multiSigAddress, options);

      expect(result).toEqual(txResult);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        multiSig.setAdmin,
        { admin: null },
        options
      );
    });
  });

  describe('getPayer', () => {
    it('should return the payer identity', async () => {
      const mockIdentity = new MockIdentity() as unknown as Identity;

      multiSig.getPayer = jest.fn().mockResolvedValue(mockIdentity);

      const result = await service.getPayer(multiSigAddress);

      expect(result).toEqual(mockIdentity);
    });

    it('should handle errors', () => {
      multiSig.getPayer = jest.fn().mockRejectedValue(new Error('Some error'));

      return expect(service.getPayer(multiSigAddress)).rejects.toThrow(AppInternalError);
    });
  });

  describe('getAdmin', () => {
    it('should return the admin identity', async () => {
      const mockIdentity = new MockIdentity() as unknown as Identity;
      multiSig.getAdmin = jest.fn().mockResolvedValue(mockIdentity);

      const result = await service.getAdmin(multiSigAddress);

      expect(result).toEqual(mockIdentity);
    });

    it('should handle errors', () => {
      multiSig.getAdmin = jest.fn().mockRejectedValue(new Error('Some error'));

      return expect(service.getAdmin(multiSigAddress)).rejects.toThrow(AppInternalError);
    });
  });
});
