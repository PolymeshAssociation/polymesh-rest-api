/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  AffirmationStatus,
  InstructionStatus,
  InstructionType,
  VenueType,
} from '@polymathnetwork/polymesh-sdk/types';

import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { IdentitiesService } from '~/identities/identities.service';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';

import { MockInstructionClass } from './../test-utils/mocks';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('SettlementsController', () => {
  let controller: SettlementsController;
  const mockSettlementsService = {
    findInstruction: jest.fn(),
    createInstruction: jest.fn(),
    affirmInstruction: jest.fn(),
    findVenueDetails: jest.fn(),
    findAffirmations: jest.fn(),
  };
  const mockIdentitiesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementsController],
      providers: [SettlementsService, IdentitiesService],
    })
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    controller = module.get<SettlementsController>(SettlementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInstruction', () => {
    it('should return the Instruction details', async () => {
      const date = new Date();

      const mockInstruction = new MockInstructionClass();
      const mockInstructionDetails = {
        venue: {
          id: new BigNumber('123'),
        },
        status: InstructionStatus.Pending,
        createdDate: date,
        tradeDate: null,
        valueDate: null,
        type: InstructionType.SettleOnBlock,
        endBlock: new BigNumber('1000000'),
      };
      const mockLegs = {
        data: [
          {
            from: {
              owner: {
                did: '0x6'.padEnd(66, '0'),
              },
            },
            to: {
              owner: {
                did: '0x6'.padEnd(66, '1'),
              },
            },
            amount: new BigNumber('100'),
            token: {
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
      const result = await controller.getInstruction({ id: new BigNumber('3') });

      expect(result).toEqual({
        ...mockInstructionDetails,
        legs:
          mockLegs.data.map(({ from, to, amount, token: asset }) => ({
            from,
            to,
            amount,
            asset,
          })) || [],
      });
    });
  });

  describe('createInstruction', () => {
    it('should create an instruction and return the data returned by the service', async () => {
      const transactions = ['transaction'];
      const mockData = {
        result: 'fakeInstruction',
        transactions,
      };
      mockSettlementsService.createInstruction.mockResolvedValue(mockData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.createInstruction({ id: new BigNumber('3') }, {} as any);

      expect(result).toEqual({
        instructionId: 'fakeInstruction',
        transactions,
      });
    });
  });

  describe('affirmInstruction', () => {
    it('should affirm an instruction and return the data returned by the service', async () => {
      const transactions = ['transaction'];
      const mockData = {
        transactions,
      };
      mockSettlementsService.affirmInstruction.mockResolvedValue(mockData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.affirmInstruction({ id: new BigNumber('3') }, {} as any);

      expect(result).toEqual({
        transactions,
      });
    });
  });

  describe('getVenueDetails', () => {
    it('should return the details of the Venue', async () => {
      const mockVenueDetails = {
        owner: {
          did: '0x6'.padEnd(66, '0'),
        },
        description: 'Venue desc',
        type: VenueType.Distribution,
      };
      mockSettlementsService.findVenueDetails.mockResolvedValue(mockVenueDetails);

      const result = await controller.getVenueDetails({ id: new BigNumber('3') });

      expect(result).toEqual(mockVenueDetails);
    });
  });

  describe('getAffirmations', () => {
    it('should return the list of affirmations generated for a Instruction', async () => {
      const mockAffirmations = {
        data: [
          {
            identity: {
              did: '0x6'.padEnd(66, '0'),
            },
            status: AffirmationStatus.Pending,
          },
        ],
        next: null,
      };
      mockSettlementsService.findAffirmations.mockResolvedValue(mockAffirmations);

      const result = await controller.getAffirmations({ id: new BigNumber('3') }, { size: 10 });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockAffirmations.data,
          next: null,
        })
      );
    });
  });
});
