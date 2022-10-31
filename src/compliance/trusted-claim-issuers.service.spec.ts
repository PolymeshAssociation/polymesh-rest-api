import { Test, TestingModule } from '@nestjs/testing';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { MockAsset } from '~/test-utils/mocks';
import {
  MockAssetService,
  MockComplianceRequirementsService,
  mockTransactionsProvider,
} from '~/test-utils/service-mocks';

describe('ComplianceRequirementsService', () => {
  let service: TrustedClaimIssuersService;
  const mockAssetsService = new MockAssetService();
  const mockComplianceRequirementsService = new MockComplianceRequirementsService();

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
      const mockClaimIssuers = [
        {
          did: 'Ox6'.padEnd(66, '0'),
          trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
        },
      ];

      const mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      mockAsset.compliance.trustedClaimIssuers.get.mockResolvedValue(mockClaimIssuers);

      const result = await service.find('TICKER');

      expect(result).toEqual(mockClaimIssuers);
    });
  });
});
