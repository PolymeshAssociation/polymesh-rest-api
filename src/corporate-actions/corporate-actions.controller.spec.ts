import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';

import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';

import { CorporateActionsController } from './corporate-actions.controller';

describe('CorporateActionsController', () => {
  let controller: CorporateActionsController;

  const mockCorporateActionsService = {
    findDefaultsByTicker: jest.fn(),
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
});
