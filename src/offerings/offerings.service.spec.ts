import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  StoBalanceStatus,
  StoSaleStatus,
  StoTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { OfferingsService } from '~/offerings/offerings.service';
import { MockSecurityTokenClass } from '~/test-utils/mocks';

describe('OfferingsService', () => {
  let service: OfferingsService;
  const mockAssetsService = {
    findOne: jest.fn(),
  };

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

      const mockSecurityToken = new MockSecurityTokenClass();
      mockSecurityToken.offerings.get.mockResolvedValue(mockOfferings);
      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findAllByTicker('TICKER', { timing: StoTimingStatus.Started });

      expect(result).toEqual(mockOfferings);
    });
  });
  describe('findInvestments', () => {
    const mockInvestments = {
      data: [
        {
          investor: '0x6000',
          soldAmount: '100',
          investedAmount: '200',
        },
      ],
      next: '10',
      count: 2,
    };
    const mockAsset = {
      offerings: {
        get: jest.fn(),
      },
    };
    const offerings = [
      {
        sto: {
          id: new BigNumber(1),
          getInvestments: jest.fn().mockReturnValue(mockInvestments),
        },
      },
    ];
    describe('if the offering is not found', () => {
      it('should throw a NotFoundException', async () => {
        mockAsset.offerings.get.mockResolvedValue(offerings);
        mockAssetsService.findOne.mockReturnValue(mockAsset);

        let error;
        try {
          await service.findInvestments('GME', new BigNumber('99'), 0);
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('otherwise', () => {
      it('should return a list of investments', async () => {
        mockAsset.offerings.get.mockResolvedValue(offerings);
        mockAssetsService.findOne.mockReturnValue(mockAsset);

        const result = await service.findInvestments('GME', new BigNumber('1'), 0);

        expect(result).toEqual({
          data: mockInvestments.data,
          count: mockInvestments.count,
          next: mockInvestments.next,
        });
      });
    });
  });
});
