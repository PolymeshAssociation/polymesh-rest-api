import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfidentialAccount } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { ServiceReturn } from '~/common/utils';
import { ConfidentialAccountsController } from '~/confidential-accounts/confidential-accounts.controller';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { ConfidentialAccountEntity } from '~/proof-server/entities/confidential-account.entity';
import { ProofServerService } from '~/proof-server/proof-server.service';
import { testValues } from '~/test-utils/consts';
import { createMockIdentity } from '~/test-utils/mocks';
import {
  mockConfidentialAccountsServiceProvider,
  mockProofServerServiceProvider,
} from '~/test-utils/service-mocks';

const { signer, txResult } = testValues;

describe('ConfidentialAccountsController', () => {
  let controller: ConfidentialAccountsController;
  let mockConfidentialAccountsService: DeepMocked<ConfidentialAccountsService>;
  let mockProofServerService: DeepMocked<ProofServerService>;
  const confidentialAccount = 'SOME_PUBLIC_KEY';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialAccountsController],
      providers: [mockConfidentialAccountsServiceProvider, mockProofServerServiceProvider],
    }).compile();

    mockConfidentialAccountsService = module.get<typeof mockConfidentialAccountsService>(
      ConfidentialAccountsService
    );

    mockProofServerService = module.get<typeof mockProofServerService>(ProofServerService);
    controller = module.get<ConfidentialAccountsController>(ConfidentialAccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAccounts', () => {
    it('should get the owner of a Confidential Account', async () => {
      when(mockProofServerService.getConfidentialAccounts)
        .calledWith()
        .mockResolvedValue([
          {
            confidential_account: 'SOME_PUBLIC_KEY',
          } as ConfidentialAccountEntity,
        ]);

      const result = await controller.getAccounts();

      expect(result).toEqual([new ConfidentialAccountModel({ publicKey: 'SOME_PUBLIC_KEY' })]);
    });
  });

  describe('createAccount', () => {
    it('should call the service and return the results', async () => {
      const mockAccount = {
        confidential_account: 'SOME_PUBLIC_KEY',
      };

      mockProofServerService.createConfidentialAccount.mockResolvedValue(
        mockAccount as unknown as ConfidentialAccountEntity
      );

      const result = await controller.createAccount();

      expect(result).toEqual(new ConfidentialAccountModel({ publicKey: 'SOME_PUBLIC_KEY' }));
    });
  });

  describe('mapAccount', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
      };
      mockConfidentialAccountsService.mapConfidentialAccount.mockResolvedValue(
        txResult as unknown as ServiceReturn<ConfidentialAccount>
      );

      const result = await controller.mapAccount({ confidentialAccount }, input);
      expect(result).toEqual(txResult);
    });
  });

  describe('getOwner', () => {
    it('should get the owner of a Confidential Account', async () => {
      mockConfidentialAccountsService.fetchOwner.mockResolvedValue(
        createMockIdentity({ did: 'OWNER_DID' })
      );

      const result = await controller.getOwner({ confidentialAccount });

      expect(result).toEqual(expect.objectContaining({ did: 'OWNER_DID' }));
    });
  });
});
