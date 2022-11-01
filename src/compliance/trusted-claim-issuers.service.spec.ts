import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { MockAsset, MockTransaction } from '~/test-utils/mocks';
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
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.AddDefaultTrustedClaimIssuer,
      };

      const mockTransaction = new MockTransaction(transaction);

      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockAsset.compliance.trustedClaimIssuers.set.mockResolvedValue(mockClaimIssuers);

      const result = await service.set('TICKER', mockPayload);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('add', () => {
    it('should add trusted Claim Issuers for an Asset', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.AddDefaultTrustedClaimIssuer,
      };

      const mockTransaction = new MockTransaction(transaction);

      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockAsset.compliance.trustedClaimIssuers.add.mockResolvedValue(mockClaimIssuers);

      const result = await service.add('TICKER', mockPayload);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });
});
