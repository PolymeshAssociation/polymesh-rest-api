import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  AffirmationStatus,
  Identity,
  InstructionStatus,
  InstructionType,
  Nft,
  TransferError,
} from '@polymeshassociation/polymesh-sdk/types';
import { isAccount, isDefaultPortfolio } from '@polymeshassociation/polymesh-sdk/utils';
import { when } from 'jest-when';

import { AssetHolderType } from '~/common/dto/asset-holder.dto';
import { AssetHolderModel, createAssetHolderModel } from '~/common/models/asset-holder.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { LegType } from '~/common/types';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import {
  InstructionAffirmationModel,
  InstructionAffirmationPartyType,
} from '~/settlements/models/instruction-affirmation.model';
import { LegModel } from '~/settlements/models/leg.model';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';
import * as settlementsUtil from '~/settlements/settlements.util';
import { processedTxResult, testValues } from '~/test-utils/consts';
import { MockInstruction, MockPortfolio } from '~/test-utils/mocks';
import { MockSettlementsService } from '~/test-utils/service-mocks';
import { setupInstructionMock, testControllerTxResult } from '~/test-utils/test-helpers';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isAccount: jest.fn(),
  isDefaultPortfolio: jest.fn(),
}));

const mockIsAccount = isAccount as unknown as jest.MockedFunction<typeof isAccount>;
const mockIsDefaultPortfolio = isDefaultPortfolio as unknown as jest.MockedFunction<
  typeof isDefaultPortfolio
>;
const { did, txResult } = testValues;

describe('SettlementsController', () => {
  let controller: SettlementsController;
  const mockSettlementsService = new MockSettlementsService();

  beforeEach(async () => {
    mockIsAccount.mockImplementation((val: unknown) =>
      Boolean((val as { address?: string } | undefined)?.address)
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementsController],
      providers: [SettlementsService],
    })
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .compile();

    controller = module.get<SettlementsController>(SettlementsController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInstruction', () => {
    it('should return the Instruction details', async () => {
      const date = new Date();
      const mediatorDid = 'mediatorDid';

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
              id: 'TICKER',
            },
          },
          {
            from: new MockPortfolio(),
            to: new MockPortfolio(),
            nfts: [createMock<Nft>({ id: new BigNumber(1) })],
            asset: {
              id: 'TICKER',
            },
          },
          {
            from: createMock<Identity>({ did: '0x01' }),
            to: createMock<Identity>({ did: '0x02' }),
            offChainAmount: new BigNumber(100),
            asset: 'OFF_CHAIN_TICKER',
          },
        ],
        next: null,
      };
      mockInstruction.details.mockResolvedValue(mockInstructionDetails);
      mockInstruction.getStatus.mockResolvedValue({ status: InstructionStatus.Pending });
      mockInstruction.getLegs.mockResolvedValue(mockLegs);
      mockInstruction.getMediators.mockResolvedValue([
        { identity: createMock<Identity>({ did: mediatorDid }), status: AffirmationStatus.Pending },
      ]);
      mockSettlementsService.findInstruction.mockResolvedValue(mockInstruction);
      mockIsDefaultPortfolio.mockReturnValue(true);
      const result = await controller.getInstruction({ id: new BigNumber(3) });

      expect(result).toEqual({
        ...mockInstructionDetails,
        venue: mockInstructionDetails.venue.id,
        mediators: [{ identity: mediatorDid, status: AffirmationStatus.Pending }],
        legs: [
          ...[mockLegs.data[0], mockLegs.data[1]].map(({ from, to, amount, nfts, asset }) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            from: createAssetHolderModel(from as any),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to: createAssetHolderModel(to as any),
            amount,
            nfts,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            asset: (asset as any).id,
            type: LegType.onChain,
          })),
          {
            from: '0x01',
            to: '0x02',
            offChainAmount: new BigNumber(100),
            asset: 'OFF_CHAIN_TICKER',
            type: LegType.offChain,
          },
        ],
      });
    });

    it('should handle SettleManual instruction type', async () => {
      const mockInstruction = new MockInstruction();
      const date = new Date();
      const mockInstructionDetails = {
        venue: {
          id: new BigNumber(123),
        },
        status: InstructionStatus.Pending,
        createdAt: date,
        type: InstructionType.SettleManual,
        endAfterBlock: new BigNumber(1000000),
      };
      setupInstructionMock(mockInstruction, mockInstructionDetails);
      mockSettlementsService.findInstruction.mockResolvedValue(mockInstruction);
      const result = await controller.getInstruction({ id: new BigNumber(3) });

      expect(result).toBeDefined();
      expect(result.type).toBe(InstructionType.SettleManual);
      expect(result.endAfterBlock).toEqual(new BigNumber(1000000));
    });

    it('should handle non-Pending instruction status', async () => {
      const mockInstruction = new MockInstruction();
      const date = new Date();
      const mockEventIdentifier = {
        blockNumber: new BigNumber(1000),
        eventIndex: new BigNumber(1),
      };
      const mockInstructionDetails = {
        venue: {
          id: new BigNumber(123),
        },
        status: InstructionStatus.Failed,
        createdAt: date,
        type: InstructionType.SettleOnBlock,
        endBlock: new BigNumber(1000000),
      };
      mockInstruction.details.mockResolvedValue(mockInstructionDetails);
      mockInstruction.getStatus.mockResolvedValue({
        status: InstructionStatus.Failed,
        eventIdentifier: mockEventIdentifier,
      });
      mockInstruction.getLegs.mockResolvedValue({ data: [], next: null });
      mockInstruction.getMediators.mockResolvedValue([]);
      mockSettlementsService.findInstruction.mockResolvedValue(mockInstruction);
      const result = await controller.getInstruction({ id: new BigNumber(3) });

      expect(result).toBeDefined();
      expect(result.status).toBe(InstructionStatus.Failed);
      expect(result.eventIdentifier).toBeDefined();
    });

    it('should handle empty legs array', async () => {
      const mockInstruction = new MockInstruction();
      const date = new Date();
      const mockInstructionDetails = {
        venue: {
          id: new BigNumber(123),
        },
        status: InstructionStatus.Pending,
        createdAt: date,
        type: InstructionType.SettleOnBlock,
        endBlock: new BigNumber(1000000),
      };
      setupInstructionMock(mockInstruction, mockInstructionDetails);
      mockSettlementsService.findInstruction.mockResolvedValue(mockInstruction);
      const result = await controller.getInstruction({ id: new BigNumber(3) });

      expect(result).toBeDefined();
      expect(result.legs).toEqual([]);
    });

    it('should handle null legs from legsToLegModel', async () => {
      const mockInstruction = new MockInstruction();
      const date = new Date();
      const mockInstructionDetails = {
        venue: {
          id: new BigNumber(123),
        },
        status: InstructionStatus.Pending,
        createdAt: date,
        type: InstructionType.SettleOnBlock,
        endBlock: new BigNumber(1000000),
      };
      setupInstructionMock(mockInstruction, mockInstructionDetails);
      mockSettlementsService.findInstruction.mockResolvedValue(mockInstruction);

      // Mock legsToLegModel to return null to trigger the legs ?? [] fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legsToLegModelSpy = jest
        .spyOn(settlementsUtil, 'legsToLegModel')
        .mockReturnValue(null as unknown as LegModel[]);

      const result = await controller.getInstruction({ id: new BigNumber(3) });

      expect(result).toBeDefined();
      expect(result.legs).toEqual([]);

      legsToLegModelSpy.mockRestore();
    });
  });

  describe('affirmInstruction', () => {
    it('should affirm an instruction and return the data returned by the service', async () => {
      await testControllerTxResult(
        controller.affirmInstruction.bind(controller),
        mockSettlementsService.affirmInstruction,
        { id: new BigNumber(3) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any
      );
    });
  });

  describe('rejectInstruction', () => {
    it('should reject an instruction and return the data returned by the service', async () => {
      await testControllerTxResult(
        controller.rejectInstruction.bind(controller),
        mockSettlementsService.rejectInstruction,
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );
    });
  });

  describe('withdrawAffirmation', () => {
    it('should withdraw affirmation from an instruction and return the data returned by the service', async () => {
      await testControllerTxResult(
        controller.withdrawAffirmation.bind(controller),
        mockSettlementsService.withdrawAffirmation,
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );
    });
  });

  describe('affirmInstructionAsMediator', () => {
    it('should affirm an instruction and return the data returned by the service', async () => {
      await testControllerTxResult(
        controller.affirmInstructionAsMediator.bind(controller),
        mockSettlementsService.affirmInstructionAsMediator,
        { id: new BigNumber(3) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any
      );
    });
  });

  describe('rejectInstructionAsMediator', () => {
    it('should reject an instruction and return the data returned by the service', async () => {
      await testControllerTxResult(
        controller.rejectInstructionAsMediator.bind(controller),
        mockSettlementsService.rejectInstructionAsMediator,
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );
    });
  });

  describe('withdrawAffirmationAsMediator', () => {
    it('should withdraw affirmation from an instruction and return the data returned by the service', async () => {
      await testControllerTxResult(
        controller.withdrawAffirmationAsMediator.bind(controller),
        mockSettlementsService.withdrawAffirmationAsMediator,
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );
    });
  });

  describe('getAffirmations', () => {
    it('should return the list of affirmations generated for a Instruction', async () => {
      const mockAffirmations = {
        data: [
          {
            party: {
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
          results: [
            {
              party: { did },
              partyType: InstructionAffirmationPartyType.identity,
              identity: { did },
              status: AffirmationStatus.Pending,
            },
          ],
          next: null,
        })
      );
    });

    it('should handle when start is present and no more data is returned', async () => {
      const mockAffirmations = {
        data: undefined,
        next: null,
      };
      mockSettlementsService.findAffirmations.mockResolvedValue(mockAffirmations);

      const result = await controller.getAffirmations(
        { id: new BigNumber(3) },
        { size: new BigNumber(10), start: new BigNumber(10) }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: [],
          next: null,
        })
      );
    });

    it('should return account party type for account affirmations', async () => {
      const accountAddress = '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM';
      mockIsAccount.mockReturnValue(true);
      const mockAffirmations = {
        data: [
          {
            party: { address: accountAddress } as Account,
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
          results: [
            new InstructionAffirmationModel({
              party: new AssetHolderModel({
                type: AssetHolderType.account,
                address: accountAddress,
              }),
              partyType: InstructionAffirmationPartyType.account,
              identity: undefined,
              status: AffirmationStatus.Pending,
            }),
          ],
          next: null,
        })
      );
    });
  });

  describe('getOffChainAffirmations', () => {
    it('should return the list of off chain affirmations for a Instruction', async () => {
      const mockAffirmations = [
        {
          legId: new BigNumber(0),
          status: AffirmationStatus.Pending,
        },
      ];
      mockSettlementsService.fetchOffChainAffirmations.mockResolvedValue(mockAffirmations);

      const result = await controller.getOffChainAffirmations({ id: new BigNumber(3) });

      expect(result).toEqual({
        results: mockAffirmations,
      });
    });
  });

  describe('getOffChainAffirmationForLeg', () => {
    it('should return the off chain affirmation status for a specific leg in an Instruction', async () => {
      const mockAffirmationStatus = AffirmationStatus.Pending;
      mockSettlementsService.fetchOffChainAffirmationForALeg.mockResolvedValue(
        mockAffirmationStatus
      );

      const result = await controller.getOffChainAffirmationForLeg({
        id: new BigNumber(3),
        legId: new BigNumber(0),
      });

      expect(result).toEqual({
        legId: new BigNumber(0),
        status: mockAffirmationStatus,
      });
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

    it('should use fromAccount and toAccount when provided', async () => {
      const mockTransferBreakdown = {
        general: [TransferError.SelfTransfer],
        compliance: {
          requirements: [],
          complies: false,
        },
        restrictions: [],
        result: false,
      };
      const fromAccount = 'fromAddress';
      const toAccount = 'toAddress';

      mockSettlementsService.canTransfer.mockResolvedValue(mockTransferBreakdown);

      const result = await controller.validateLeg({
        fromAccount,
        toAccount,
        asset: 'TICKER',
        amount: new BigNumber(123),
      });

      expect(mockSettlementsService.canTransfer).toHaveBeenCalledWith(
        fromAccount,
        toAccount,
        'TICKER',
        new BigNumber(123),
        undefined
      );
      expect(result).toEqual(mockTransferBreakdown);
    });
  });

  describe('executeInstruction', () => {
    it('should execute an instruction and return the data returned by the service', async () => {
      await testControllerTxResult(
        controller.executeInstruction.bind(controller),
        mockSettlementsService.executeInstruction,
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );
    });
  });

  describe('addInstruction', () => {
    it('should create an instruction and return the data returned by the service', async () => {
      const mockInstruction = new MockInstruction();

      when(mockInstruction.getLegsFromChain).calledWith().mockResolvedValue({ data: [] });

      const mockData = {
        ...txResult,
        result: mockInstruction,
      };
      mockSettlementsService.createInstruction.mockResolvedValue(mockData);

      const result = await controller.addInstruction({} as CreateInstructionDto);

      expect(result).toEqual({
        ...processedTxResult,
        instruction: mockInstruction, // in jest the @FromEntity decorator is not applied
        legs: [],
      });
    });
  });
});
