import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { VenueType } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { SignerCountModel } from '~/settlements/models/signer-count.model';
import { SettlementsService } from '~/settlements/settlements.service';
import { VenuesController } from '~/settlements/venues.controller';
import { processedTxResult, testValues } from '~/test-utils/consts';
import { MockInstruction, MockVenue } from '~/test-utils/mocks';
import { MockSettlementsService } from '~/test-utils/service-mocks';

const { did, signer, txResult } = testValues;

describe('VenuesController', () => {
  let controller: VenuesController;
  const mockSettlementsService = new MockSettlementsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenuesController],
      providers: [SettlementsService],
    })
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .compile();

    controller = module.get<VenuesController>(VenuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVenueDetails', () => {
    it('should return the details of the Venue', async () => {
      const mockVenueDetails = {
        owner: {
          did,
        },
        description: 'Venue desc',
        type: VenueType.Distribution,
      };
      mockSettlementsService.findVenueDetails.mockResolvedValue(mockVenueDetails);

      const result = await controller.getVenueDetails({ id: new BigNumber(3) });

      expect(result).toEqual(mockVenueDetails);
    });
  });

  describe('createVenue', () => {
    it('should create a Venue and return the data returned by the service', async () => {
      const body = {
        signer,
        description: 'Generic Exchange',
        type: VenueType.Exchange,
      };
      const mockVenue = new MockVenue();
      const mockData = {
        ...txResult,
        result: mockVenue,
      };
      mockSettlementsService.createVenue.mockResolvedValue(mockData);

      const result = await controller.createVenue(body);

      expect(result).toEqual({
        ...processedTxResult,
        venue: mockVenue,
      });
    });
  });

  describe('modifyVenue', () => {
    it('should modify a venue and return the data returned by the service', async () => {
      mockSettlementsService.modifyVenue.mockResolvedValue(txResult);

      const body = {
        signer,
        description: 'A generic exchange',
        type: VenueType.Exchange,
      };

      const result = await controller.modifyVenue({ id: new BigNumber(3) }, body);

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('createInstruction', () => {
    it('should create an instruction and return the data returned by the service', async () => {
      const mockInstruction = new MockInstruction();

      when(mockInstruction.getLegsFromChain).calledWith().mockResolvedValue({ data: [] });

      const mockData = {
        ...txResult,
        result: mockInstruction,
      };
      mockSettlementsService.createInstruction.mockResolvedValue(mockData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.createInstruction({ id: new BigNumber(3) }, {} as any);

      expect(result).toEqual({
        ...processedTxResult,
        instruction: mockInstruction, // in jest the @FromEntity decorator is not applied
        legs: [],
      });
    });
  });
  describe('getAllowedSigners', () => {
    it('should return the list of allowed signers', async () => {
      const mockSigners = [{ address: 'signer1' }, { address: 'signer2' }];
      mockSettlementsService.fetchAllowedSigners.mockResolvedValue(mockSigners);

      const result = await controller.getAllowedSigners({ id: new BigNumber(3) });

      expect(result).toEqual({
        results: ['signer1', 'signer2'],
      });
    });
  });

  describe('getSignerCount', () => {
    it('should return the number of signers allowed by the Venue', async () => {
      mockSettlementsService.fetchSignerCount.mockResolvedValue(new BigNumber(2));

      const result = await controller.getSignerCount({ id: new BigNumber(3) });

      expect(result).toEqual(new SignerCountModel({ count: new BigNumber(2) }));
    });
  });

  describe('addVenueSigners', () => {
    it('should add signers to a venue and return the data returned by the service', async () => {
      mockSettlementsService.updateVenueSigners.mockResolvedValue(txResult);

      const body = {
        signer,
        signers: ['signer1'],
      };

      const result = await controller.addVenueSigners({ id: new BigNumber(3) }, body);

      expect(result).toEqual(processedTxResult);
      expect(mockSettlementsService.updateVenueSigners).toHaveBeenCalledWith(
        new BigNumber(3),
        body,
        true
      );
    });
  });

  describe('removeVenueSigners', () => {
    it('should remove signers from a venue and return the data returned by the service', async () => {
      mockSettlementsService.updateVenueSigners.mockResolvedValue(txResult);

      const body = {
        signer,
        signers: ['signer1'],
      };

      const result = await controller.removeVenueSigners({ id: new BigNumber(3) }, body);

      expect(result).toEqual(processedTxResult);
      expect(mockSettlementsService.updateVenueSigners).toHaveBeenCalledWith(
        new BigNumber(3),
        body,
        false
      );
    });
  });
});
