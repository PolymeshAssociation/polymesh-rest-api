import { Test, TestingModule } from '@nestjs/testing';
import { ClaimType, ConditionType, ScopeType, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ComplianceService } from '~/compliance/compliance.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockAssetService,
  MockRelayerAccountsService,
  MockSecurityToken,
  MockTransactionQueue,
} from '~/test-utils/mocks';

describe('ComplianceService', () => {
  let service: ComplianceService;
  const mockRelayerAccountsService = new MockRelayerAccountsService();
  const mockAssetsService = new MockAssetService();

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

  describe('findComplianceRequirements', () => {
    it('should return the list of Asset compliance requirements', async () => {
      const mockRequirements = [
        {
          id: 1,
          conditions: [
            {
              type: ConditionType.IsPresent,
              claim: {
                type: ClaimType.Accredited,
                scope: {
                  type: ScopeType.Identity,
                  value: 'Ox6'.padEnd(66, '0'),
                },
              },
              target: 'Receiver',
              trustedClaimIssuers: [],
            },
          ],
        },
      ];

      const mockSecurityToken = new MockSecurityToken();

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);
      mockSecurityToken.compliance.requirements.get.mockResolvedValue(mockRequirements);

      const result = await service.findComplianceRequirements('TICKER');

      expect(result).toEqual(mockRequirements);
    });
  });

  describe('setRequirements', () => {
    it('should run a set rules procedure and return the queue data', async () => {
      const mockAsset = new MockSecurityToken();
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.complianceManager.AddComplianceRequirement,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      const address = 'address';
      mockAsset.compliance.requirements.set.mockResolvedValue(mockQueue);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

      const body = { requirements: [], signer: '0x6000', asSetAssetRequirementsParams: jest.fn() };

      const result = await service.setRequirements('TICKER', body);

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
