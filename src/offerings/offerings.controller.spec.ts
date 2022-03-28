import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { OfferingTimingStatus } from '@polymathnetwork/polymesh-sdk/types';

import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { MockOfferingWithDetails } from '~/offerings/mocks/offering-with-details.mock';
import { OfferingsController } from '~/offerings/offerings.controller';
import { OfferingsService } from '~/offerings/offerings.service';
import { createOfferingDetailsModel } from '~/offerings/offerings.util';

describe('OfferingsController', () => {
  let controller: OfferingsController;
  const mockOfferingsService = {
    findInvestmentsByTicker: jest.fn(),
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
      const mockOfferings = [new MockOfferingWithDetails()];

      mockOfferingsService.findAllByTicker.mockResolvedValue(mockOfferings);

      const result = await controller.getOfferings(
        { ticker: 'TICKER' },
        { timing: OfferingTimingStatus.Started }
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

  describe('getInvestments', () => {
    const mockInvestments = {
      data: [
        {
          investor: '0x6000',
          soldAmount: '100',
          investedAmount: '200',
        },
      ],
      next: '10',
      count: new BigNumber(2),
    };
    it('should return a paginated list of Investments made in an Offering', async () => {
      mockOfferingsService.findInvestmentsByTicker.mockResolvedValue(mockInvestments);

      const result = await controller.getInvestments(
        { ticker: 'TICKER', id: new BigNumber(1) },
        { start: new BigNumber(0), size: new BigNumber(10) }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockInvestments.data,
          total: new BigNumber(mockInvestments.count),
          next: mockInvestments.next,
        })
      );
    });
  });
});
