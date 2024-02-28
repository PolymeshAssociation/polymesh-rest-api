import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ConfidentialTransaction } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { ServiceReturn } from '~/common/utils';
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { ConfidentialProofsController } from '~/confidential-proofs/confidential-proofs.controller';
import { ConfidentialProofsService } from '~/confidential-proofs/confidential-proofs.service';
import { ConfidentialAccountEntity } from '~/confidential-proofs/entities/confidential-account.entity';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { testValues, txResult } from '~/test-utils/consts';
import {
  mockConfidentialProofsServiceProvider,
  mockConfidentialTransactionsServiceProvider,
} from '~/test-utils/service-mocks';

const { signer } = testValues;

describe('ConfidentialProofsController', () => {
  let controller: ConfidentialProofsController;
  let mockConfidentialProofsService: DeepMocked<ConfidentialProofsService>;
  let mockConfidentialTransactionsService: DeepMocked<ConfidentialTransactionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialProofsController],
      providers: [
        mockConfidentialProofsServiceProvider,
        mockConfidentialTransactionsServiceProvider,
      ],
    }).compile();

    mockConfidentialProofsService =
      module.get<typeof mockConfidentialProofsService>(ConfidentialProofsService);
    mockConfidentialTransactionsService = module.get<typeof mockConfidentialTransactionsService>(
      ConfidentialTransactionsService
    );
    controller = module.get<ConfidentialProofsController>(ConfidentialProofsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAccounts', () => {
    it('should get the owner of a Confidential Account', async () => {
      when(mockConfidentialProofsService.getConfidentialAccounts)
        .calledWith()
        .mockResolvedValue([
          {
            confidentialAccount: 'SOME_PUBLIC_KEY',
          } as ConfidentialAccountEntity,
        ]);

      const result = await controller.getAccounts();

      expect(result).toEqual([new ConfidentialAccountModel({ publicKey: 'SOME_PUBLIC_KEY' })]);
    });
  });

  describe('createAccount', () => {
    it('should call the service and return the results', async () => {
      const mockAccount = {
        confidentialAccount: 'SOME_PUBLIC_KEY',
      };

      mockConfidentialProofsService.createConfidentialAccount.mockResolvedValue(
        mockAccount as unknown as ConfidentialAccountEntity
      );

      const result = await controller.createAccount();

      expect(result).toEqual(new ConfidentialAccountModel({ publicKey: 'SOME_PUBLIC_KEY' }));
    });
  });

  describe('senderAffirmLeg', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
        legId: new BigNumber(0),
        legAmounts: [
          {
            confidentialAsset: 'SOME_ASSET_ID',
            amount: new BigNumber(100),
          },
        ],
      };

      const transactionId = new BigNumber(1);

      when(mockConfidentialTransactionsService.senderAffirmLeg)
        .calledWith(transactionId, input)
        .mockResolvedValue(txResult as unknown as ServiceReturn<ConfidentialTransaction>);

      const result = await controller.senderAffirmLeg({ id: transactionId }, input);
      expect(result).toEqual(txResult);
    });
  });

  describe('verifySenderProofAsAuditor', () => {
    it('should call the service and return the results', async () => {
      const mockResponse = {
        isValid: true,
        amount: new BigNumber(10),
        errMsg: null,
      };

      mockConfidentialProofsService.verifySenderProofAsAuditor.mockResolvedValue(mockResponse);

      const result = await controller.verifySenderProofAsAuditor(
        { confidentialAccount: 'SOME_PUBLIC_KEY' },
        {
          amount: new BigNumber(10),
          auditorId: new BigNumber(1),
          senderProof: '0xproof',
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifySenderProofAsReceiver', () => {
    it('should call the service and return the results', async () => {
      const mockResponse = {
        isValid: true,
        amount: new BigNumber(10),
        errMsg: null,
      };

      mockConfidentialProofsService.verifySenderProofAsReceiver.mockResolvedValue(mockResponse);

      const result = await controller.verifySenderProofAsReceiver(
        { confidentialAccount: 'SOME_PUBLIC_KEY' },
        {
          amount: new BigNumber(10),
          senderProof: '0xproof',
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
