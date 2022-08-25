import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { OfferingTimingStatus } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { MockOfferingWithDetails } from '~/offerings/mocks/offering-with-details.mock';
import { OfferingsService } from '~/offerings/offerings.service';
import { MockAsset } from '~/test-utils/mocks';
import { MockAssetService } from '~/test-utils/service-mocks';

describe('OfferingsService', () => {
  let service: OfferingsService;
  const mockAssetsService = new MockAssetService();

  let mockOfferingWithDetails: MockOfferingWithDetails;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfferingsService, AssetsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<OfferingsService>(OfferingsService);

    mockOfferingWithDetails = new MockOfferingWithDetails();
    mockOfferingWithDetails.offering.getInvestments.mockReturnValue(mockInvestments);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByTicker', () => {
    it('should return the list of Offerings for an Asset', async () => {
      const mockOfferings = [new MockOfferingWithDetails()];

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
    it('should return a list of investments', async () => {
      const findSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockOfferingWithDetails as any);

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
    describe('if the offering is not found', () => {
      it('should throw a NotFoundException', async () => {
        const findSpy = jest.spyOn(service, 'findAllByTicker');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findSpy.mockResolvedValue([mockOfferingWithDetails] as any);

        let error;
        try {
          await service.findInvestmentsByTicker('TICKER', new BigNumber(99), new BigNumber(0));
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
        findSpy.mockResolvedValue([mockOfferingWithDetails] as any);

        const result = await service.findOne('TICKER', new BigNumber(1));
        expect(result).toEqual(mockOfferingWithDetails);
        findSpy.mockRestore();
      });
    });
  });
});
