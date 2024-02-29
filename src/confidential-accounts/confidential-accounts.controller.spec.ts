import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfidentialAccount } from '@polymeshassociation/polymesh-sdk/types';

import { ServiceReturn } from '~/common/utils';
import { ConfidentialAccountsController } from '~/confidential-accounts/confidential-accounts.controller';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { testValues } from '~/test-utils/consts';
import { createMockConfidentialAsset, createMockIdentity } from '~/test-utils/mocks';
import { mockConfidentialAccountsServiceProvider } from '~/test-utils/service-mocks';

const { signer, txResult } = testValues;

describe('ConfidentialAccountsController', () => {
  let controller: ConfidentialAccountsController;
  let mockConfidentialAccountsService: DeepMocked<ConfidentialAccountsService>;
  const confidentialAccount = 'SOME_PUBLIC_KEY';

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

  describe('linkAccount', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
      };
      mockConfidentialAccountsService.linkConfidentialAccount.mockResolvedValue(
        txResult as unknown as ServiceReturn<ConfidentialAccount>
      );

      const result = await controller.linkAccount({ confidentialAccount }, input);
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

  describe('getAllBalances and getAllIncomingBalances', () => {
    it('should get all confidential asset balances', async () => {
      const confidentialAsset = createMockConfidentialAsset();
      const balance = '0xsomebalance';
      const mockResult = [
        {
          confidentialAsset,
          balance,
        },
      ];
      mockConfidentialAccountsService.getAllBalances.mockResolvedValue(mockResult);

      let result = await controller.getAllBalances({ confidentialAccount });

      expect(result).toEqual(
        expect.arrayContaining([{ confidentialAsset: confidentialAsset.id, balance }])
      );

      mockConfidentialAccountsService.getAllIncomingBalances.mockResolvedValue(mockResult);

      result = await controller.getAllIncomingBalances({ confidentialAccount });

      expect(result).toEqual(
        expect.arrayContaining([{ confidentialAsset: confidentialAsset.id, balance }])
      );
    });
  });

  describe('getConfidentialAssetBalance and getIncomingConfidentialAssetBalance', () => {
    it('should get all confidential asset balances', async () => {
      const confidentialAssetId = 'SOME_ASSET_ID';
      const balance = '0xsomebalance';
      mockConfidentialAccountsService.getAssetBalance.mockResolvedValue(balance);

      let result = await controller.getConfidentialAssetBalance({
        confidentialAccount,
        confidentialAssetId,
      });

      expect(result).toEqual(balance);

      mockConfidentialAccountsService.getIncomingAssetBalance.mockResolvedValue(balance);

      result = await controller.getIncomingConfidentialAssetBalance({
        confidentialAccount,
        confidentialAssetId,
      });

      expect(result).toEqual(balance);
    });
  });
});
