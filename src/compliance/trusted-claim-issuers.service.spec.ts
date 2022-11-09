import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Asset, ClaimType, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionType } from '~/common/types';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { createMockTransactionResult, MockAsset } from '~/test-utils/mocks';
import {
  MockAssetService,
  MockComplianceRequirementsService,
  mockTransactionsProvider,
} from '~/test-utils/service-mocks';

describe('TrustedClaimIssuersService', () => {
  let service: TrustedClaimIssuersService;
  const mockAssetsService = new MockAssetService();
  const mockComplianceRequirementsService = new MockComplianceRequirementsService();
  const mockTransactionsService = mockTransactionsProvider.useValue;

  const mockPayload = {
    signer: 'Alice',
    claimIssuers: [
      {
        identity: 'Ox6'.padEnd(66, '0'),
        trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
      },
    ],
  };

  const mockClaimIssuers = [
    {
      identity: 'Ox6'.padEnd(66, '0'),
      trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        ComplianceRequirementsService,
        TrustedClaimIssuersService,
        mockTransactionsProvider,
      ],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(ComplianceRequirementsService)
      .useValue(mockComplianceRequirementsService)
      .compile();

    service = module.get(TrustedClaimIssuersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find', () => {
    it('should return the list of trusted Claim Issuers of an Asset', async () => {
      const mockAsset = new MockAsset();

      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockAsset.compliance.trustedClaimIssuers.get.mockResolvedValue(mockClaimIssuers);

      const result = await service.find('TICKER');

      expect(result).toEqual(mockClaimIssuers);
    });
  });

  describe('set', () => {
    it('should set trusted Claim Issuers for an Asset', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.complianceManager.AddDefaultTrustedClaimIssuer,
      };

      const testTxResult = createMockTransactionResult<Asset>({ transactions: [transaction] });

      mockTransactionsService.submit.mockResolvedValue(createMockTransactionResult(testTxResult));

      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockAsset.compliance.trustedClaimIssuers.set.mockResolvedValue(mockClaimIssuers);

      const result = await service.set('TICKER', mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });

  describe('add', () => {
    it('should add trusted Claim Issuers for an Asset', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.complianceManager.AddDefaultTrustedClaimIssuer,
      };

      const testTxResult = createMockTransactionResult<Asset>({ transactions: [transaction] });

      mockTransactionsService.submit.mockResolvedValue(createMockTransactionResult(testTxResult));

      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockAsset.compliance.trustedClaimIssuers.add.mockResolvedValue(mockClaimIssuers);

      const result = await service.set('TICKER', mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });

  describe('remove', () => {
    it('should remove trusted Claim Issuers for an Asset', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: TransactionType.Single,
        transactionTag: TxTags.complianceManager.RemoveDefaultTrustedClaimIssuer,
      };

      const testTxResult = createMockTransactionResult<Asset>({ transactions: [transaction] });

      mockTransactionsService.submit.mockResolvedValue(createMockTransactionResult(testTxResult));

      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockAsset.compliance.trustedClaimIssuers.remove.mockResolvedValue(mockClaimIssuers);

      const result = await service.set('TICKER', mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });
});
