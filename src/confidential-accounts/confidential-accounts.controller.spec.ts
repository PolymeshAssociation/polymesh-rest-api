import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfidentialAccount } from '@polymeshassociation/polymesh-sdk/types';

import { ServiceReturn } from '~/common/utils';
import { ConfidentialAccountsController } from '~/confidential-accounts/confidential-accounts.controller';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { testValues } from '~/test-utils/consts';
import { createMockIdentity } from '~/test-utils/mocks';
import { mockConfidentialAccountsServiceProvider } from '~/test-utils/service-mocks';

const { signer, txResult } = testValues;

describe('ConfidentialAccountsController', () => {
  let controller: ConfidentialAccountsController;
  let mockConfidentialAccountsService: DeepMocked<ConfidentialAccountsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialAccountsController],
      providers: [mockConfidentialAccountsServiceProvider],
    }).compile();

    mockConfidentialAccountsService = module.get<typeof mockConfidentialAccountsService>(
      ConfidentialAccountsService
    );
    controller = module.get<ConfidentialAccountsController>(ConfidentialAccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOwner', () => {
    it('should get the owner of a Confidential Account', async () => {
      mockConfidentialAccountsService.fetchOwner.mockResolvedValue(
        createMockIdentity({ did: 'OWNER_DID' })
      );

      const result = await controller.getOwner({ publicKey: 'SOME_PUBLIC_KEY' });

      expect(result).toEqual(expect.objectContaining({ did: 'OWNER_DID' }));
    });
  });

  describe('createAccount', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
        publicKey: 'SOME_PUBLIC_KEY',
      };
      mockConfidentialAccountsService.createConfidentialAccount.mockResolvedValue(
        txResult as unknown as ServiceReturn<ConfidentialAccount>
      );

      const result = await controller.mapAccount(input);
      expect(result).toEqual(txResult);
    });
  });
});
