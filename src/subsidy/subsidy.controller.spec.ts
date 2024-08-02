import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AllowanceOperation, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { ProcessMode, TransactionType } from '~/common/types';
import { CreateSubsidyDto } from '~/subsidy/dto/create-subsidy.dto';
import { ModifyAllowanceDto } from '~/subsidy/dto/modify-allowance.dto';
import { QuitSubsidyDto } from '~/subsidy/dto/quit-subsidy.dto';
import { SubsidyController } from '~/subsidy/subsidy.controller';
import { SubsidyService } from '~/subsidy/subsidy.service';
import { processedTxResult, txResult } from '~/test-utils/consts';
import { createMockTransactionResult, MockAuthorizationRequest } from '~/test-utils/mocks';
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

  describe('subsidizeAccount', () => {
    it('should accept CreateSubsidyDto and return the authorization request for adding as paying key', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.relayer.AcceptPayingKey,
      };
      const mockAuthorization = new MockAuthorizationRequest();
      const testTxResult = createMockTransactionResult<MockAuthorizationRequest>({
        ...txResult,
        transactions: [transaction],
        result: mockAuthorization,
      });
      const mockPayload: CreateSubsidyDto = {
        signer: 'Alice',
        beneficiary,
        allowance,
      };

      when(mockService.subsidizeAccount)
        .calledWith(mockPayload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(testTxResult as any);

      const result = await controller.subsidizeAccount(mockPayload);

      expect(result).toEqual(
        new CreatedAuthorizationRequestModel({
          ...processedTxResult,
          transactions: [transaction],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
        })
      );
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
