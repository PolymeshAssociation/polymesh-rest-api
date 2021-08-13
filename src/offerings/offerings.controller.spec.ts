import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  StoBalanceStatus,
  StoSaleStatus,
  StoTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';

import { ResultsModel } from '~/common/models/results.model';
import { OfferingsController } from '~/offerings/offerings.controller';
import { OfferingsService } from '~/offerings/offerings.service';
import { createOfferingDetailsModel } from '~/offerings/offerings.util';

describe('OfferingsController', () => {
  let controller: OfferingsController;

  const mockOfferingsService = {
    findAllByTicker: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferingsController],
      providers: [OfferingsService],
    })
      .overrideProvider(OfferingsService)
      .useValue(mockOfferingsService)
      .compile();

    controller = module.get<OfferingsController>(OfferingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOfferings', () => {
    it('should return the list of Offerings for an Asset', async () => {
      const mockOfferings = [
        {
          sto: {
            id: new BigNumber('1'),
          },
          details: {
            tiers: [
              {
                amount: new BigNumber('1000'),
                price: new BigNumber('1'),
                remaining: new BigNumber('1000'),
              },
            ],
            creator: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            name: 'SERIES A',
            offeringPortfolio: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            raisingPortfolio: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            raisingCurrency: 'CURRENCY',
            venue: {
              id: new BigNumber('1'),
            },
            start: new Date(),
            end: null,
            status: {
              timing: StoTimingStatus.Started,
              balance: StoBalanceStatus.Available,
              sale: StoSaleStatus.Live,
            },
            minInvestment: new BigNumber('1'),
            totalAmount: new BigNumber('1000'),
            totalRemaining: new BigNumber('1000'),
          },
        },
      ];

      mockOfferingsService.findAllByTicker.mockResolvedValue(mockOfferings);

      const result = await controller.getOfferings(
        { ticker: 'SOME_TICKER' },
        { timing: StoTimingStatus.Started }
      );

      const mockResult = new ResultsModel({
        results: mockOfferings.map(offering =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createOfferingDetailsModel(offering as any)
        ),
      });
      expect(result).toEqual(mockResult);
    });
  });
});
