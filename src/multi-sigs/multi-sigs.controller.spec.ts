import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  MultiSig,
  MultiSigProposal,
  MultiSigProposalDetails,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

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

  describe('joinCreator', () => {
    it('should call the service and return the result', async () => {
      const params = { asPrimary: true };

      when(service.joinCreator).calledWith(multiSigAddress, params).mockResolvedValue(txResult);

      const result = await controller.joinCreator({ multiSigAddress }, params);

      expect(result).toEqual(processedTxResult);
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
});
