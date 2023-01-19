import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AffirmationStatus,
  InstructionStatus,
  InstructionType,
  TransferError,
  VenueType,
} from '@polymeshassociation/polymesh-sdk/types';

import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';
import { testValues } from '~/test-utils/consts';
import { MockInstruction, MockPortfolio, MockVenue } from '~/test-utils/mocks';
import { MockSettlementsService } from '~/test-utils/service-mocks';

const { did, signer, txResult } = testValues;

describe('SettlementsController', () => {
  let controller: SettlementsController;
  const mockSettlementsService = new MockSettlementsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementsController],
      providers: [SettlementsService],
    })
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .compile();

    controller = module.get<SettlementsController>(SettlementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInstruction', () => {
    it('should return the Instruction details', async () => {
      const date = new Date();

      const mockInstruction = new MockInstruction();
      const mockInstructionDetails = {
        venue: {
          id: new BigNumber(123),
        },
        status: InstructionStatus.Pending,
        createdAt: date,
        type: InstructionType.SettleOnBlock,
        endBlock: new BigNumber(1000000),
      };
      const mockLegs = {
        data: [
          {
            from: new MockPortfolio(),
            to: new MockPortfolio(),
            amount: new BigNumber(100),
            asset: {
              ticker: 'TICKER',
            },
          },
        ],
        next: null,
      };
      mockInstruction.details.mockResolvedValue(mockInstructionDetails);
      mockInstruction.getStatus.mockResolvedValue({ status: InstructionStatus.Pending });
      mockInstruction.getLegs.mockResolvedValue(mockLegs);
      mockSettlementsService.findInstruction.mockResolvedValue(mockInstruction);
      const result = await controller.getInstruction({ id: new BigNumber(3) });

      expect(result).toEqual({
        ...mockInstructionDetails,
        legs:
          mockLegs.data.map(({ from, to, amount, asset }) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            from: createPortfolioIdentifierModel(from as any),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to: createPortfolioIdentifierModel(to as any),
            amount,
            asset,
          })) || [],
      });
    });
  });

  describe('createInstruction', () => {
    it('should create an instruction and return the data returned by the service', async () => {
      const mockData = {
        ...txResult,
        result: 'fakeInstruction',
      };
      mockSettlementsService.createInstruction.mockResolvedValue(mockData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.createInstruction({ id: new BigNumber(3) }, {} as any);

      expect(result).toEqual({
        ...txResult,
        instruction: 'fakeInstruction',
      });
    });
  });

  describe('affirmInstruction', () => {
    it('should affirm an instruction and return the data returned by the service', async () => {
      mockSettlementsService.affirmInstruction.mockResolvedValue(txResult);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.affirmInstruction({ id: new BigNumber(3) }, {} as any);

      expect(result).toEqual(txResult);
    });
  });

  describe('rejectInstruction', () => {
    it('should reject an instruction and return the data returned by the service', async () => {
      mockSettlementsService.rejectInstruction.mockResolvedValue(txResult);

      const result = await controller.affirmInstruction(
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('rescheduleInstruction', () => {
    it('should reschedule a failed instruction and return the data returned by the service', async () => {
      mockSettlementsService.rescheduleInstruction.mockResolvedValue(txResult);

      const result = await controller.rescheduleInstruction(
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('getAffirmations', () => {
    it('should return the list of affirmations generated for a Instruction', async () => {
      const mockAffirmations = {
        data: [
          {
            identity: {
              did,
            },
            status: AffirmationStatus.Pending,
          },
        ],
        next: null,
      };
      mockSettlementsService.findAffirmations.mockResolvedValue(mockAffirmations);

      const result = await controller.getAffirmations(
        { id: new BigNumber(3) },
        { size: new BigNumber(10) }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockAffirmations.data,
          next: null,
        })
      );
    });
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
        ...txResult,
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

      expect(result).toEqual(txResult);
    });
  });

  describe('validateLeg', () => {
    it('should call the service and return the Leg validations', async () => {
      const mockTransferBreakdown = {
        general: [TransferError.SelfTransfer, TransferError.ScopeClaimMissing],
        compliance: {
          requirements: [],
          complies: false,
        },
        restrictions: [],
        result: false,
      };

      mockSettlementsService.canTransfer.mockResolvedValue(mockTransferBreakdown);

      const result = await controller.validateLeg({
        fromDid: 'fromDid',
        fromPortfolio: new BigNumber(1),
        toDid: 'toDid',
        toPortfolio: new BigNumber(1),
        asset: 'TICKER',
        amount: new BigNumber(123),
      });

      expect(result).toEqual(mockTransferBreakdown);
    });
  });
});
