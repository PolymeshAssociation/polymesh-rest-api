import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  OfferingBalanceStatus,
  OfferingSaleStatus,
  OfferingTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { OfferingsService } from '~/offerings/offerings.service';
import { MockAsset, MockPortfolio } from '~/test-utils/mocks';
import { MockAssetService } from '~/test-utils/service-mocks';

describe('OfferingsService', () => {
  let service: OfferingsService;
  const mockAssetsService = new MockAssetService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfferingsService, AssetsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<OfferingsService>(OfferingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByTicker', () => {
    it('should return the list of Offerings for an Asset', async () => {
      const mockOfferings = [
        {
          offering: {
            id: new BigNumber(1),
          },
          details: {
            tiers: [
              {
                amount: new BigNumber('1000'),
                price: new BigNumber(1),
                remaining: new BigNumber('1000'),
              },
            ],
            creator: {
              did: 'Ox6'.padEnd(66, '0'),
            },
            name: 'SERIES A',
            offeringPortfolio: new MockPortfolio(),
            raisingPortfolio: new MockPortfolio(),
            raisingCurrency: 'CURRENCY',
            venue: {
              id: new BigNumber(1),
            },
            start: new Date(),
            end: null,
            status: {
              timing: OfferingTimingStatus.Started,
              balance: OfferingBalanceStatus.Available,
              sale: OfferingSaleStatus.Live,
            },
            minInvestment: new BigNumber(1),
            totalAmount: new BigNumber('1000'),
            totalRemaining: new BigNumber('1000'),
          },
        },
      ];

      const mockAsset = new MockAsset();
      mockAsset.offerings.get.mockResolvedValue(mockOfferings);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findAllByTicker('TICKER', {
        timing: OfferingTimingStatus.Started,
      });

      expect(result).toEqual(mockOfferings);
    });
  });
  describe('findInvestmentsByTicker', () => {
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
    const offering = {
      id: new BigNumber(1),
      getInvestments: jest.fn().mockReturnValue(mockInvestments),
    };
    it('should return a list of investments', async () => {
      const findSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue({ offering } as any);

      const result = await service.findInvestmentsByTicker(
        'TICKER',
        new BigNumber(1),
        new BigNumber(0)
      );

      expect(result).toEqual({
        data: mockInvestments.data,
        count: mockInvestments.count,
        next: mockInvestments.next,
      });
      findSpy.mockRestore();
    });
  });
  describe('findOne', () => {
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
    const offerings = [
      {
        offering: {
          id: new BigNumber(1),
          getInvestments: jest.fn().mockReturnValue(mockInvestments),
        },
      },
    ];
    describe('if the offering is not found', () => {
      it('should throw a NotFoundException', async () => {
        const findSpy = jest.spyOn(service, 'findAllByTicker');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findSpy.mockResolvedValue(offerings as any);

        let error;
        try {
          await service.findInvestmentsByTicker('TICKER', new BigNumber('99'), new BigNumber(0));
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(NotFoundException);
        findSpy.mockRestore();
      });
    });
    describe('otherwise', () => {
      it('should return the offering', async () => {
        const findSpy = jest.spyOn(service, 'findAllByTicker');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findSpy.mockResolvedValue(offerings as any);

        const result = await service.findOne('TICKER', new BigNumber(1));
        expect(result).toEqual(offerings[0]);
        findSpy.mockRestore();
      });
    });
  });
});
