import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AllowanceOperation, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { ProcessMode, TransactionType } from '~/common/types';
import { AcceptSubsidyDto } from '~/subsidy/dto/accept-subsidy.dto';
import { CreateSubsidyDto } from '~/subsidy/dto/create-subsidy.dto';
import { ModifyAllowanceDto } from '~/subsidy/dto/modify-allowance.dto';
import { QuitSubsidyDto } from '~/subsidy/dto/quit-subsidy.dto';
import { RevokeSubsidyDto } from '~/subsidy/dto/revoke-subsidy.dto';
import { SubsidyController } from '~/subsidy/subsidy.controller';
import { SubsidyService } from '~/subsidy/subsidy.service';
import { processedTxResult, txResult } from '~/test-utils/consts';
import { createMockTransactionResult } from '~/test-utils/mocks';
import { mockSubsidyServiceProvider } from '~/test-utils/service-mocks';

describe('SubsidyController', () => {
  let controller: SubsidyController;
  let mockService: DeepMocked<SubsidyService>;
  let beneficiary: string;
  let subsidizer: string;
  let allowance: BigNumber;

  beforeEach(async () => {
    beneficiary = 'beneficiary';
    subsidizer = 'subsidizer';
    allowance = new BigNumber(1000);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubsidyController],
      providers: [mockSubsidyServiceProvider],
    }).compile();

    mockService = mockSubsidyServiceProvider.useValue as DeepMocked<SubsidyService>;

    controller = module.get<SubsidyController>(SubsidyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSubsidy', () => {
    it('should return subsidy details for a given beneficiary and subsidizer', async () => {
      when(mockService.getAllowance)
        .calledWith(beneficiary, subsidizer)
        .mockResolvedValue(allowance);

      const result = await controller.getSubsidy({ beneficiary, subsidizer });

      expect(result).toEqual(
        expect.objectContaining({
          beneficiary: expect.objectContaining({ address: beneficiary }),
          subsidizer: expect.objectContaining({ address: subsidizer }),
          allowance,
        })
      );
    });
  });

  describe('approveSubsidy', () => {
    it('should accept CreateSubsidyDto and return transaction details', async () => {
      const mockPayload: CreateSubsidyDto = {
        signer: 'Alice',
        beneficiary,
        allowance,
      };

      when(mockService.approveSubsidy)
        .calledWith(mockPayload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(txResult as any);

      const result = await controller.approveSubsidy(mockPayload);

      expect(result).toEqual(processedTxResult);
      expect(mockService.approveSubsidy).toHaveBeenCalledWith(mockPayload);
    });
  });

  describe('acceptSubsidy', () => {
    it('should accept AcceptSubsidyDto and return transaction details', async () => {
      const mockPayload: AcceptSubsidyDto = {
        signer: beneficiary,
        subsidizer,
      };

      when(mockService.acceptSubsidy)
        .calledWith(mockPayload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(txResult as any);

      const result = await controller.acceptSubsidy(mockPayload);

      expect(result).toEqual(processedTxResult);
      expect(mockService.acceptSubsidy).toHaveBeenCalledWith(mockPayload);
    });
  });

  describe('revokeSubsidy', () => {
    it('should accept RevokeSubsidyDto and return transaction details', async () => {
      const mockPayload: RevokeSubsidyDto = {
        signer: subsidizer,
        beneficiary,
      };

      when(mockService.revokeSubsidy)
        .calledWith(mockPayload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(txResult as any);

      const result = await controller.revokeSubsidy(mockPayload);

      expect(result).toEqual(processedTxResult);
      expect(mockService.revokeSubsidy).toHaveBeenCalledWith(mockPayload);
    });
  });

  describe('setAllowance, increaseAllowance, decreaseAllowance', () => {
    it('should accept ModifyAllowanceDto and return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.relayer.UpdatePolyxLimit,
      };
      const testTxResult = createMockTransactionResult({
        ...txResult,
        transactions: [transaction],
      });
      const mockPayload: ModifyAllowanceDto = {
        signer: 'Alice',
        beneficiary,
        allowance,
      };

      when(mockService.modifyAllowance)
        .calledWith(mockPayload, AllowanceOperation.Set)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(testTxResult as any);

      let result = await controller.setAllowance(mockPayload);

      expect(result).toEqual(testTxResult);

      when(mockService.modifyAllowance)
        .calledWith(mockPayload, AllowanceOperation.Increase)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(testTxResult as any);

      result = await controller.increaseAllowance(mockPayload);

      expect(result).toEqual(testTxResult);

      when(mockService.modifyAllowance)
        .calledWith(mockPayload, AllowanceOperation.Decrease)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(testTxResult as any);

      result = await controller.decreaseAllowance(mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });

  describe('quitSubsidy', () => {
    it('should accept QuitSubsidyDto and return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.relayer.RemovePayingKey,
      };
      const testTxResult = createMockTransactionResult({
        ...txResult,
        transactions: [transaction],
      });
      const mockPayload: QuitSubsidyDto = {
        options: { signer: 'Alice', processMode: ProcessMode.Submit },
        beneficiary,
      };

      when(mockService.quit)
        .calledWith(mockPayload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(testTxResult as any);

      const result = await controller.quitSubsidy(mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });
});
