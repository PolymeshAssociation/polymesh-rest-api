/* eslint-disable import/first */
const mockIsMultiSigAccount = jest.fn();

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Account, MultiSig, MultiSigProposal } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AccountsService } from '~/accounts/accounts.service';
import { AppInternalError, AppValidationError } from '~/common/errors';
import { MultiSigsService } from '~/multi-sigs/multi-sigs.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { testValues, txResult } from '~/test-utils/consts';
import { MockPolymesh } from '~/test-utils/mocks';
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

  beforeEach(async () => {
    mockAccountService = createMock<AccountsService>();
    mockTransactionsService = new MockTransactionsService();

    multiSig = createMock<MultiSig>({ address: multiSigAddress });
    proposal = createMock<MultiSigProposal>({ id: proposalId });
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

  describe('joinCreator', () => {
    it('should join the multiSig to the creator', async () => {
      const result = await service.joinCreator(multiSigAddress, { options });

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
});
