import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';

import { ResultsModel } from '~/common/models/results.model';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { DistributionWithDetailsModel } from '~/corporate-actions/model/dividend-distribution-details.model';

import { CorporateActionsController } from './corporate-actions.controller';

describe('CorporateActionsController', () => {
  let controller: CorporateActionsController;

  const mockCorporateActionsService = {
    findDefaultsByTicker: jest.fn(),
    findDistributionsByTicker: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporateActionsController],
      providers: [CorporateActionsService],
    })
      .overrideProvider(CorporateActionsService)
      .useValue(mockCorporateActionsService)
      .compile();

    controller = module.get<CorporateActionsController>(CorporateActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      mockCorporateActionsService.findDefaultsByTicker.mockResolvedValue(
        mockCorporateActionDefaults
      );

      const result = await controller.getDefaults({ ticker: 'TICKER' });

      expect(result).toEqual(mockCorporateActionDefaults);
    });
  });

  describe('getDividendDistributions', () => {
    it('should return the Dividend Distributions associated with an Asset', async () => {
      const mockDate = new Date();
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
            paymentDate: mockDate,
            ticker: 'TOKEN4',
            id: new BigNumber('1'),
            declarationDate: mockDate,
            defaultTaxWithholding: new BigNumber('0'),
            taxWithholdings: [],
            targets: {
              identities: ['Ox6'.padEnd(66, '0')],
              treatment: TargetTreatment.Exclude,
            },
            description: 'uuuu',
            remainingFunds: new BigNumber('2100.1'),
            fundsReclaimed: false,
          },
          details: {
            remainingFunds: new BigNumber('2100.1'),
            fundsReclaimed: false,
          },
        },
      ];

      mockCorporateActionsService.findDistributionsByTicker.mockResolvedValue(mockDistributions);

      const result = await controller.getDividendDistributions({ ticker: 'TICKER' });

      expect(result).toEqual(
        new ResultsModel({
          results: mockDistributions.map(
            ({ distribution, details }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              new DistributionWithDetailsModel({ distribution: distribution as any, ...details })
          ),
        })
      );
    });
  });
});
