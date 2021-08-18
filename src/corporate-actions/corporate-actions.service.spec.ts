import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { MockSecurityTokenClass } from '~/test-utils/mocks';

import { CorporateActionsService } from './corporate-actions.service';

describe('CorporateActionsService', () => {
  let service: CorporateActionsService;

  const mockAssetsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporateActionsService, AssetsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<CorporateActionsService>(CorporateActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDefaultsByTicker', () => {
    it('should return the Corporate Action defaults for an Asset', async () => {
      const mockCorporateActionDefaults = {
        targets: {
          treatment: TargetTreatment.Include,
          identities: [
            {
              did: '0x0600000000000000000000000000000000000000000000000000000000000000',
            },
            {
              did: '0x0611111111111111111111111111111111111111111111111111111111111111',
            },
          ],
        },
        defaultTaxWithholding: new BigNumber('0.0005'),
        taxWithholdings: [
          {
            identity: {
              did: '0x0611111111111111111111111111111111111111111111111111111111111111',
            },
            percentage: new BigNumber('0.0001'),
          },
        ],
      };

      const mockSecurityToken = new MockSecurityTokenClass();
      mockSecurityToken.corporateActions.getDefaults.mockResolvedValue(mockCorporateActionDefaults);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findDefaultsByTicker('TICKER');

      expect(result).toEqual(mockCorporateActionDefaults);
    });
  });

  describe('findDistributionsByTicker', () => {
    it('should return the Dividend Distributions associated with an Asset', async () => {
      const mockDistributions = [
        {
          distribution: {
            origin: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            currency: 'TOKEN2',
            perShare: new BigNumber('0.1'),
            maxAmount: new BigNumber('2100.1'),
            expiryDate: null,
            paymentDate: new Date(),
            ticker: 'TOKEN4',
            id: new BigNumber('1'),
            declarationDate: new Date(),
            defaultTaxWithholding: new BigNumber('0'),
            taxWithholdings: [],
            targets: {
              identities: ['Ox6'.padEnd(66, '0')],
              treatment: TargetTreatment.Exclude,
            },
            description: 'uuuu',
          },
          details: {
            remainingFunds: new BigNumber('2100.1'),
            fundsReclaimed: false,
          },
        },
      ];

      const mockSecurityToken = new MockSecurityTokenClass();
      mockSecurityToken.corporateActions.distributions.get.mockResolvedValue(mockDistributions);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findDistributionsByTicker('TICKER');

      expect(result).toEqual(mockDistributions);
    });
  });
});
