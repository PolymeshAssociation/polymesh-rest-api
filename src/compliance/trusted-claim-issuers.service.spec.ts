import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Asset, ClaimType, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionModel } from '~/common/models/transaction.model';
import { TransactionType } from '~/common/types';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { testValues } from '~/test-utils/consts';
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
  const getMockTransaction = (
    transactionTag: string
  ): TransactionModel | BatchTransactionModel => ({
    blockHash: '0x1',
    transactionHash: '0x2',
    blockNumber: new BigNumber(1),
    type: TransactionType.Single,
    transactionTag,
  });
  const { txResult, signer } = testValues;

  const mockClaimIssuers = [
    {
      identity: 'Ox6'.padEnd(66, '0'),
      trustedFor: [ClaimType.Accredited, ClaimType.Affiliate],
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

  afterEach(() => {
    mockTransactionsService.submit.mockReset();
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
      const testTxResult = createMockTransactionResult<Asset>({
        ...txResult,
        transactions: [getMockTransaction(TxTags.complianceManager.AddDefaultTrustedClaimIssuer)],
      });

      mockTransactionsService.submit.mockResolvedValue(testTxResult);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.set('TICKER', { signer, claimIssuers: mockClaimIssuers });

      expect(result).toEqual(testTxResult);
    });
  });

  describe('add', () => {
    it('should add trusted Claim Issuers for an Asset', async () => {
      const mockAsset = new MockAsset();
      const testTxResult = createMockTransactionResult<Asset>({
        ...txResult,
        transactions: [getMockTransaction(TxTags.complianceManager.AddDefaultTrustedClaimIssuer)],
      });

      mockTransactionsService.submit.mockResolvedValue(testTxResult);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.add('TICKER', { signer, claimIssuers: mockClaimIssuers });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.compliance.trustedClaimIssuers.add,
        { claimIssuers: mockClaimIssuers },
        { signer }
      );
      expect(result).toEqual(testTxResult);
    });
  });

  describe('remove', () => {
    it('should remove trusted Claim Issuers for an Asset', async () => {
      const mockAsset = new MockAsset();
      const testTxResult = createMockTransactionResult<Asset>({
        ...txResult,
        transactions: [
          getMockTransaction(TxTags.complianceManager.RemoveDefaultTrustedClaimIssuer),
        ],
      });

      mockTransactionsService.submit.mockResolvedValue(testTxResult);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.remove('TICKER', {
        signer,
        claimIssuers: [mockClaimIssuers[0].identity],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.compliance.trustedClaimIssuers.remove,
        { claimIssuers: [mockClaimIssuers[0].identity] },
        { signer }
      );
      expect(result).toEqual(testTxResult);
    });
  });
});
