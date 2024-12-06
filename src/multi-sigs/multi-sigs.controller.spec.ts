import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  HistoricalMultiSigProposal,
  Identity,
  MultiSig,
  MultiSigProposal,
  MultiSigProposalDetails,
  ResultSet,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
import { MultiSigProposalModel } from '~/multi-sigs/models/multi-sig-proposal.model';
import { MultiSigProposalDetailsModel } from '~/multi-sigs/models/multi-sig-proposal-details.model';
import { MultiSigsController } from '~/multi-sigs/multi-sigs.controller';
import { MultiSigsService } from '~/multi-sigs/multi-sigs.service';
import { processedTxResult, txResult } from '~/test-utils/consts';

describe('MultiSigsController', () => {
  const multiSigAddress = 'someMultiAddress';
  let controller: MultiSigsController;
  let service: DeepMocked<MultiSigsService>;
  let mockMultiSig: DeepMocked<MultiSig>;

  beforeEach(async () => {
    service = createMock<MultiSigsService>();
    mockMultiSig = createMock<MultiSig>({ address: multiSigAddress });

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: MultiSigsService, useValue: service }],
      controllers: [MultiSigsController],
    }).compile();

    controller = module.get<MultiSigsController>(MultiSigsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call the service and return the result', async () => {
      const params = { signers: ['someAddress'], requiredSignatures: new BigNumber(1) };

      when(service.create)
        .calledWith(params)
        .mockResolvedValue({ ...txResult, result: mockMultiSig });

      const result = await controller.create(params);

      expect(result).toEqual({ ...processedTxResult, multiSigAddress });
    });
  });

  describe('modify', () => {
    it('should call the service and return the result', async () => {
      const params = {
        requiredSignatures: new BigNumber(3),
        signers: [],
      };

      when(service.modify).calledWith(multiSigAddress, params).mockResolvedValue(txResult);

      const result = await controller.modify({ multiSigAddress }, params);

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('getProposal', () => {
    it('should return details about the proposal', async () => {
      const mockProposal = createMock<MultiSigProposal>({
        multiSig: mockMultiSig,
        id: new BigNumber(2),
      });
      const mockDetails = createMock<MultiSigProposalDetails>({ txTag: TxTags.asset.Issue });

      mockProposal.details.mockResolvedValue(mockDetails);

      service.findProposal.mockResolvedValue(mockProposal);

      const result = await controller.getProposal({
        multiSigAddress,
        proposalId: new BigNumber(2),
      });

      expect(result).toEqual(
        expect.objectContaining({
          multiSigAddress,
          proposalId: new BigNumber(2),
          details: expect.objectContaining({ txTag: TxTags.asset.Issue }),
        })
      );
    });
  });

  describe('approveProposal', () => {
    it('should call the service and return the result', async () => {
      const params = { multiSigAddress, proposalId: new BigNumber(3) };

      when(service.approve).calledWith(params, {}).mockResolvedValue(txResult);

      const result = await controller.approveProposal(params, {});

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('rejectProposal', () => {
    it('should call the service and return the result', async () => {
      const params = { multiSigAddress, proposalId: new BigNumber(3) };

      when(service.reject).calledWith(params, {}).mockResolvedValue(txResult);

      const result = await controller.rejectProposal(params, {});

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('getAdmin', () => {
    it('should return the admin identity', async () => {
      const mockIdentity = createMock<Identity>({ did: 'ADMIN_DID' });
      when(service.getAdmin).calledWith(multiSigAddress).mockResolvedValue(mockIdentity);

      const result = await controller.getAdmin({ multiSigAddress });

      expect(result).toEqual(new IdentitySignerModel({ did: 'ADMIN_DID' }));
    });

    it('should throw NotFoundException if no identity is associated', async () => {
      when(service.getAdmin).calledWith(multiSigAddress).mockResolvedValue(null);

      await expect(controller.getAdmin({ multiSigAddress })).rejects.toThrow(NotFoundException);
    });
  });

  describe('setAdmin', () => {
    it('should call the service and return the result', async () => {
      const params = {
        signers: ['someAddress'],
        requiredSignatures: new BigNumber(1),
        admin: 'NEW_ADMIN_DID',
      };
      when(service.setAdmin).calledWith(multiSigAddress, params).mockResolvedValue(txResult);

      const result = await controller.setAdmin({ multiSigAddress }, params);

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('removeAdmin', () => {
    it('should call the service and return the result', async () => {
      when(service.removeAdmin).calledWith(multiSigAddress, {}).mockResolvedValue(txResult);

      const result = await controller.removeAdmin({ multiSigAddress }, {});

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('getHistoricalProposals', () => {
    it('should return paginated historical proposals', async () => {
      const mockDetails = createMock<MultiSigProposalDetails>({ txTag: TxTags.asset.Issue });

      const mockProposal1 = createMock<MultiSigProposal>({
        multiSig: mockMultiSig,
        details: jest.fn().mockResolvedValue(mockDetails),
        id: new BigNumber(1),
      });
      const mockProposal2 = createMock<MultiSigProposal>({
        multiSig: mockMultiSig,
        details: jest.fn().mockResolvedValue(mockDetails),
        id: new BigNumber(2),
      });

      const historic1 = createMock<HistoricalMultiSigProposal>({
        proposal: mockProposal1,
      });
      const historic2 = createMock<HistoricalMultiSigProposal>({
        proposal: mockProposal2,
      });

      // Passing `HistoricalMultiSigProposal` would give an infinite type error
      const mockPaginatedResult = createMock<ResultSet<unknown>>({
        data: [historic1, historic2],
        next: new BigNumber(2),
        count: new BigNumber(2),
      }) as ResultSet<HistoricalMultiSigProposal>;

      when(service.getHistoricalProposals)
        .calledWith(multiSigAddress)
        .mockResolvedValue(mockPaginatedResult);

      const result = await controller.getHistoricalProposals({ multiSigAddress });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: [
            new MultiSigProposalModel({
              multiSigAddress,
              proposalId: mockProposal1.id,
              details: new MultiSigProposalDetailsModel(mockDetails),
            }),
            new MultiSigProposalModel({
              multiSigAddress,
              proposalId: mockProposal2.id,
              details: new MultiSigProposalDetailsModel(mockDetails),
            }),
          ],
          total: new BigNumber(2),
          next: new BigNumber(2),
        })
      );
    });
  });

  describe('getProposals', () => {
    it('should return active proposals', async () => {
      const mockProposal1 = createMock<MultiSigProposal>({
        multiSig: mockMultiSig,
        id: new BigNumber(1),
      });
      const mockProposal2 = createMock<MultiSigProposal>({
        multiSig: mockMultiSig,
        id: new BigNumber(2),
      });

      when(service.getProposals)
        .calledWith(multiSigAddress)
        .mockResolvedValue([mockProposal1, mockProposal2]);

      const result = await controller.getProposals({ multiSigAddress });

      expect(result).toEqual([
        expect.objectContaining({ multiSigAddress, proposalId: new BigNumber(1) }),
        expect.objectContaining({ multiSigAddress, proposalId: new BigNumber(2) }),
      ]);
    });
  });

  describe('getPayer', () => {
    it('should return the payer identity', async () => {
      const mockIdentity = createMock<Identity>({ did: 'PAYER_DID' });
      when(service.getPayer).calledWith(multiSigAddress).mockResolvedValue(mockIdentity);

      const result = await controller.getPayer({ multiSigAddress });

      expect(result).toEqual(new IdentitySignerModel({ did: 'PAYER_DID' }));
    });

    it('should throw NotFoundException if no identity is associated', async () => {
      when(service.getPayer).calledWith(multiSigAddress).mockResolvedValue(null);

      await expect(controller.getPayer({ multiSigAddress })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removePayer', () => {
    it('should call the service and return the result', async () => {
      when(service.removePayer).calledWith(multiSigAddress, {}).mockResolvedValue(txResult);

      const result = await controller.removePayer({ multiSigAddress }, {});

      expect(result).toEqual(processedTxResult);
    });
  });
});
