/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AffirmationStatus,
  ErrorCode,
  TransferError,
  TxTags,
  VenueType,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { SettlementsService } from '~/settlements/settlements.service';
import { testDid, testSigner as signer } from '~/test-utils/consts';
import {
  MockAsset,
  MockIdentity,
  MockInstruction,
  MockPolymesh,
  MockTransaction,
  MockVenue,
} from '~/test-utils/mocks';
import {
  MockAssetService,
  MockIdentitiesService,
  mockTransactionsProvider,
} from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('SettlementsService', () => {
  let service: SettlementsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  const mockIdentitiesService = new MockIdentitiesService();

  const mockAssetsService = new MockAssetService();

  const mockTransactionsService = mockTransactionsProvider.useValue;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [SettlementsService, AssetsService, IdentitiesService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<SettlementsService>(SettlementsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);

    mockIsPolymeshError.mockReturnValue(false);
    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshError.mockReset();
    mockIsPolymeshTransaction.mockReset();
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPendingInstructionsByDid', () => {
    it('should return a list of pending instructions', async () => {
      const mockIdentity = new MockIdentity();
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

      const mockInstructions = [
        { id: new BigNumber(1) },
        { id: new BigNumber(2) },
        { id: new BigNumber(3) },
      ];

      mockIdentity.getPendingInstructions.mockResolvedValue(mockInstructions);

      const result = await service.findPendingInstructionsByDid('0x01');

      expect(result).toEqual(mockInstructions);
    });
  });

  describe('findInstruction', () => {
    describe('if the instruction does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.ValidationError,
          message: "The Instruction doesn't",
        };
        mockPolymeshApi.settlements.getInstruction.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findInstruction(new BigNumber(123));
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        let expectedError = new Error('foo');
        mockPolymeshApi.settlements.getInstruction.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          await service.findInstruction(new BigNumber(123));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          await service.findInstruction(new BigNumber(123));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return the Instruction entity', async () => {
        const mockInstruction = new MockInstruction();
        mockPolymeshApi.settlements.getInstruction.mockResolvedValue(mockInstruction);
        const result = await service.findInstruction(new BigNumber(123));
        expect(result).toEqual(mockInstruction);
      });
    });
  });

  describe('findVenue', () => {
    describe('if the Venue does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.ValidationError,
          message: "The Venue doesn't",
        };
        mockPolymeshApi.settlements.getVenue.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findVenue(new BigNumber(123));
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        let expectedError = new Error('foo');
        mockPolymeshApi.settlements.getVenue.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          await service.findVenue(new BigNumber(123));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          await service.findVenue(new BigNumber(123));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return the Venue entity', async () => {
        const mockVenue = new MockVenue();
        mockPolymeshApi.settlements.getVenue.mockResolvedValue(mockVenue);
        const result = await service.findVenue(new BigNumber(123));
        expect(result).toEqual(mockVenue);
      });
    });
  });

  describe('createInstruction', () => {
    it('should run an addInstruction procedure and return the queue data', async () => {
      const mockVenue = new MockVenue();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.AddInstruction,
      };
      const mockTransaction = new MockTransaction(transaction);
      const mockInstruction = 'instruction';
      mockTransactionsService.submit.mockResolvedValue({
        result: mockInstruction,
        transactions: [mockTransaction],
      });

      const findVenueSpy = jest.spyOn(service, 'findVenue');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findVenueSpy.mockResolvedValue(mockVenue as any);

      const params = {
        legs: [
          {
            from: new PortfolioDto({ did: 'fromDid', id: new BigNumber(0) }),
            to: new PortfolioDto({ did: 'toDid', id: new BigNumber(1) }),
            amount: new BigNumber(100),
            asset: 'FAKE_TICKER',
          },
        ],
      };

      const body = {
        signer,
        ...params,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await service.createInstruction(new BigNumber(123), body as any);

      expect(result).toEqual({
        result: mockInstruction,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockVenue.addInstruction,
        {
          legs: [
            {
              from: 'fromDid',
              to: { identity: 'toDid', id: new BigNumber(1) },
              amount: new BigNumber(100),
              asset: 'FAKE_TICKER',
            },
          ],
        },
        { signer }
      );
      findVenueSpy.mockRestore();
    });
  });

  describe('createVenue', () => {
    it('should run a createVenue procedure and return the queue data', async () => {
      const mockIdentity = new MockIdentity();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.CreateVenue,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        result: undefined,
        transactions: [mockTransaction],
      });
      mockPolymeshApi.settlements.createVenue.mockResolvedValue(mockTransaction);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      const body = {
        signer,
        description: 'A generic exchange',
        type: VenueType.Exchange,
      };

      const result = await service.createVenue(body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.settlements.createVenue,
        { description: body.description, type: body.type },
        { signer }
      );
    });
  });

  describe('modifyVenue', () => {
    describe('if there is an error when updating the venue', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('New type is the same as the current one');
        const body = {
          signer,
          type: VenueType.Exchange,
          description: 'A generic exchange',
        };
        const mockVenue = new MockVenue();
        mockTransactionsService.submit.mockImplementation(() => {
          throw expectedError;
        });
        const findVenueSpy = jest.spyOn(service, 'findVenue');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findVenueSpy.mockResolvedValue(mockVenue as any);

        mockIsPolymeshError.mockReturnValue(true);

        let error = null;
        try {
          await service.modifyVenue(new BigNumber(123), body);
        } catch (err) {
          error = err;
        }
        expect(error).toEqual(expectedError);
        findVenueSpy.mockRestore();
      });
    });
    describe('otherwise', () => {
      it('should run a modify procedure and return the queue data', async () => {
        const mockVenue = new MockVenue();

        const findVenueSpy = jest.spyOn(service, 'findVenue');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findVenueSpy.mockResolvedValue(mockVenue as any);

        const transaction = {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.settlement.UpdateVenueType,
        };
        const mockTransaction = new MockTransaction(transaction);
        mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

        const body = {
          signer,
          description: 'A generic exchange',
          type: VenueType.Exchange,
        };

        const result = await service.modifyVenue(new BigNumber(123), body);

        expect(result).toEqual({
          result: undefined,
          transactions: [mockTransaction],
        });
        expect(mockTransactionsService.submit).toHaveBeenCalledWith(
          mockVenue.modify,
          { description: body.description, type: body.type },
          { signer }
        );
        findVenueSpy.mockRestore();
      });
    });
  });

  describe('affirmInstruction', () => {
    it('should run an affirm procedure and return the queue data', async () => {
      const mockInstruction = new MockInstruction();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.AffirmInstruction,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const body = {
        signer,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await service.affirmInstruction(new BigNumber(123), body as any);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.affirm,
        {},
        { signer }
      );
      findInstructionSpy.mockRestore();
    });
  });

  describe('rejectInstruction', () => {
    it('should run a reject procedure and return the queue data', async () => {
      const mockInstruction = new MockInstruction();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.RejectInstruction,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.rejectInstruction(new BigNumber(123), {
        signer,
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.reject,
        {},
        { signer }
      );
      findInstructionSpy.mockRestore();
    });
  });

  describe('findVenueDetails', () => {
    it('should return the Venue details', async () => {
      const mockDetails = {
        owner: {
          did: testDid,
        },
        description: 'Venue desc',
        type: VenueType.Distribution,
      };
      const mockVenue = new MockVenue();
      mockVenue.details.mockResolvedValue(mockDetails);

      const findVenueSpy = jest.spyOn(service, 'findVenue');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findVenueSpy.mockResolvedValue(mockVenue as any);

      const result = await service.findVenueDetails(new BigNumber(123));

      expect(result).toEqual(mockDetails);
      findVenueSpy.mockRestore();
    });
  });

  describe('findAffirmations', () => {
    it('should return a list of affirmations for an Instruction', async () => {
      const mockAffirmations = {
        data: [
          {
            identity: {
              did: testDid,
            },
            status: AffirmationStatus.Pending,
          },
        ],
        next: null,
      };

      const mockInstruction = new MockInstruction();
      mockInstruction.getAffirmations.mockResolvedValue(mockAffirmations);

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.findAffirmations(new BigNumber(123), new BigNumber(10));

      expect(result).toEqual(mockAffirmations);
      findInstructionSpy.mockRestore();
    });
  });

  describe('canTransfer', () => {
    it('should return if Asset transfer is possible ', async () => {
      const mockTransferBreakdown = {
        general: [TransferError.SelfTransfer, TransferError.ScopeClaimMissing],
        compliance: {
          requirements: [],
          complies: false,
        },
        restrictions: [],
        result: false,
      };

      const mockAsset = new MockAsset();
      mockAsset.settlements.canTransfer.mockResolvedValue(mockTransferBreakdown);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.canTransfer(
        new PortfolioDto({ did: 'fromDid', id: new BigNumber(1) }).toPortfolioLike(),
        new PortfolioDto({ did: 'toDid', id: new BigNumber(2) }).toPortfolioLike(),
        'TICKER',
        new BigNumber(123)
      );

      expect(result).toEqual(mockTransferBreakdown);
    });
  });
});
