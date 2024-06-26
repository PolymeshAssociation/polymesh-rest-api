import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AffirmationStatus,
  Identity,
  InstructionStatus,
  InstructionType,
  Nft,
  TransferError,
} from '@polymeshassociation/polymesh-sdk/types';

import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { LegType } from '~/common/types';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';
import { testValues } from '~/test-utils/consts';
import { MockInstruction, MockPortfolio } from '~/test-utils/mocks';
import { MockSettlementsService } from '~/test-utils/service-mocks';

const { did, txResult } = testValues;

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
              ticker: 'TICKER',
            },
          },
          {
            from: new MockPortfolio(),
            to: new MockPortfolio(),
            nfts: [createMock<Nft>({ id: new BigNumber(1) })],
            asset: {
              ticker: 'TICKER',
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
      const result = await controller.getInstruction({ id: new BigNumber(3) });

      expect(result).toEqual({
        ...mockInstructionDetails,
        mediators: [{ identity: mediatorDid, status: AffirmationStatus.Pending }],
        legs: [
          ...[mockLegs.data[0], mockLegs.data[1]].map(({ from, to, amount, nfts, asset }) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            from: createPortfolioIdentifierModel(from as any),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to: createPortfolioIdentifierModel(to as any),
            amount,
            nfts,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            asset: (asset as any).ticker,
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

      const result = await controller.rejectInstruction(
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('withdrawAffirmation', () => {
    it('should withdraw affirmation from an instruction and return the data returned by the service', async () => {
      mockSettlementsService.withdrawAffirmation.mockResolvedValue(txResult);

      const result = await controller.withdrawAffirmation(
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('affirmInstructionAsMediator', () => {
    it('should affirm an instruction and return the data returned by the service', async () => {
      mockSettlementsService.affirmInstructionAsMediator.mockResolvedValue(txResult);

      const result = await controller.affirmInstructionAsMediator(
        { id: new BigNumber(3) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('rejectInstructionAsMediator', () => {
    it('should reject an instruction and return the data returned by the service', async () => {
      mockSettlementsService.rejectInstructionAsMediator.mockResolvedValue(txResult);

      const result = await controller.rejectInstructionAsMediator(
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('withdrawAffirmationAsMediator', () => {
    it('should withdraw affirmation from an instruction and return the data returned by the service', async () => {
      mockSettlementsService.withdrawAffirmationAsMediator.mockResolvedValue(txResult);

      const result = await controller.withdrawAffirmationAsMediator(
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
  });

  describe('executeInstruction', () => {
    it('should execute an instruction and return the data returned by the service', async () => {
      mockSettlementsService.executeInstruction.mockResolvedValue(txResult);

      const result = await controller.executeInstruction(
        { id: new BigNumber(3) },
        { signer: 'signer' }
      );

      expect(result).toEqual(txResult);
    });
  });
});
