import { Test, TestingModule } from '@nestjs/testing';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { SetTrustedClaimIssuers } from '~/compliance/dto/set-trusted-claim-issuers.dto';
import { TrustedClaimIssuersController } from '~/compliance/trusted-claim-issuers.controller';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { MockTrustedClaimIssuersService } from '~/test-utils/service-mocks';

describe('ComplianceRequirementsController', () => {
  let controller: TrustedClaimIssuersController;

  const mockService = new MockTrustedClaimIssuersService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrustedClaimIssuersController],
      providers: [TrustedClaimIssuersService],
    })
      .overrideProvider(TrustedClaimIssuersService)
      .useValue(mockService)
      .compile();

    controller = module.get(TrustedClaimIssuersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTrustedClaimIssuers', () => {
    it('should return the list of all trusted Claim Issuers of an Asset', async () => {
      const mockClaimIssuers = [
        {
          identity: {
            did: 'Ox6'.padEnd(66, '0'),
          },
          trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
        },
      ];
      mockService.find.mockResolvedValue(mockClaimIssuers);

      const result = await controller.getTrustedClaimIssuers({ ticker: 'TICKER' });

      expect(result).toEqual({
        results: [
          {
            did: 'Ox6'.padEnd(66, '0'),
            trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
          },
        ],
      });
    });
  });

  describe('setTrustedClaimIssuers', () => {
    it('should accept SetTrustedClaimIssuersDto and set Asset trusted claim issuers', async () => {
      const mockPayload: SetTrustedClaimIssuers = {
        claimIssuers: [],
        signer: 'Alice',
      };
      const response = {
        transactions: [],
      };
      mockService.set.mockResolvedValue(response);

      const result = await controller.setTrustedClaimIssuers({ ticker: 'TICKER' }, mockPayload);

      expect(mockService.set).toHaveBeenCalledWith('TICKER', mockPayload);
      expect(result).toEqual(response);
    });
  });
});
