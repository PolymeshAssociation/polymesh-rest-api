import { Test, TestingModule } from '@nestjs/testing';
import { TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ComplianceService } from '~/compliance/compliance.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { MockRelayerAccountsService, MockTransactionQueueClass } from '~/test-utils/mocks';

describe('ComplianceService', () => {
  let service: ComplianceService;
  const mockRelayerAccountsService = new MockRelayerAccountsService();
  const mockAssetsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelayerAccountsService, AssetsService, ComplianceService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get(ComplianceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setRules', () => {
    it('should run a set rules procedure and return the queue data', async () => {
      const mockAsset = {
        compliance: {
          requirements: { set: jest.fn() },
        },
      };
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.complianceManager.AddComplianceRequirement,
        },
      ];
      const mockQueue = new MockTransactionQueueClass(transactions);
      mockAsset.compliance.requirements.set.mockResolvedValue(mockQueue);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockRelayerAccountsService.findAddressByDid.mockResolvedValue('address');

      const body = { requirements: [], signer: '0x6000', asSetAssetRequirementsParams: jest.fn() };
      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

      const result = await service.setRules('TICKER', body);

      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.complianceManager.AddComplianceRequirement,
          },
        ],
      });
    });
  });
});
