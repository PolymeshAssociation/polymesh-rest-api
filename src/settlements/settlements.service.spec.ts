/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AffirmationStatus,
  SignerKeyRingType,
  TransferError,
  TxTags,
  VenueType,
} from '@polymeshassociation/polymesh-sdk/types';
import { plainToInstance } from 'class-transformer';

import { AssetsService } from '~/assets/assets.service';
import { LegType } from '~/common/types';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { LegDto } from '~/settlements/dto/leg.dto';
import { OffChainAffirmationReceiptDto } from '~/settlements/dto/offchain-affirmation-receipt.dto';
import { OffChainLegDto } from '~/settlements/dto/offchain-leg.dto';
import { SettlementsService } from '~/settlements/settlements.service';
import { testValues } from '~/test-utils/consts';
import {
  MockAccount,
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
import * as transactionsUtilModule from '~/transactions/transactions.util';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

const { signer, did } = testValues;

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

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
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

      const mockInstructions = {
        pending: [{ id: new BigNumber(1) }, { id: new BigNumber(2) }, { id: new BigNumber(3) }],
      };

      mockIdentity.getInstructions.mockResolvedValue(mockInstructions);

      const result = await service.findGroupedInstructionsByDid('0x01');

      expect(result).toEqual(mockInstructions);
    });
  });

  describe('findInstruction', () => {
    it('should return the Instruction entity for a given ID', async () => {
      const mockInstruction = new MockInstruction();
      mockPolymeshApi.settlements.getInstruction.mockResolvedValue(mockInstruction);
      const result = await service.findInstruction(new BigNumber(123));
      expect(result).toEqual(mockInstruction);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockPolymeshApi.settlements.getInstruction.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.findInstruction(new BigNumber(123))).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('findVenue', () => {
    it('should return the Venue entity for a given ID', async () => {
      const mockVenue = new MockVenue();
      mockPolymeshApi.settlements.getVenue.mockResolvedValue(mockVenue);
      const result = await service.findVenue(new BigNumber(123));
      expect(result).toEqual(mockVenue);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockPolymeshApi.settlements.getVenue.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.findVenue(new BigNumber(123))).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('findVenuesByOwner', () => {
    it('should return the identities venues', async () => {
      const mockVenue = new MockVenue();
      const mockIdentity = new MockIdentity();
      mockIdentity.getVenues.mockResolvedValue([mockVenue]);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      const result = await service.findVenuesByOwner('someDid');
      expect(result).toEqual([mockVenue]);
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

      const onChainLeg = {
        type: LegType.onChain,
        from: new PortfolioDto({ did: 'fromDid', id: new BigNumber(0) }),
        to: new PortfolioDto({ did: 'toDid', id: new BigNumber(1) }),
        amount: new BigNumber(100),
        asset: 'FAKE_TICKER',
      };

      const offChainLeg = {
        type: LegType.offChain,
        from: '0x01',
        to: '0x02',
        offChainAmount: new BigNumber(100),
        asset: 'OFF_CHAIN_TICKER',
      };

      const params = {
        legs: [plainToInstance(LegDto, onChainLeg), plainToInstance(OffChainLegDto, offChainLeg)],
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
            {
              from: '0x01',
              to: '0x02',
              offChainAmount: new BigNumber(100),
              asset: 'OFF_CHAIN_TICKER',
            },
          ],
        },
        expect.objectContaining({ signer })
      );
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
        expect.objectContaining({ signer })
      );
    });
  });

  describe('modifyVenue', () => {
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
        expect.objectContaining({ signer })
      );
    });
  });

  describe('updateVenueSigners', () => {
    it('should run a addSigners or modifySigners procedure and return the queue data', async () => {
      const mockVenue = new MockVenue();

      const findVenueSpy = jest.spyOn(service, 'findVenue');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findVenueSpy.mockResolvedValue(mockVenue as any);

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.UpdateVenueSigners,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const body = {
        signer,
        signers: ['randomSigner'],
      };

      let result = await service.updateVenueSigners(new BigNumber(123), body, true);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockVenue.addSigners,
        { signers: body.signers },
        expect.objectContaining({ signer })
      );

      result = await service.updateVenueSigners(new BigNumber(12), body, false);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockVenue.removeSigners,
        { signers: body.signers },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('affirmInstruction', () => {
    it('should run an affirm procedure and return the queue data', async () => {
      const mockInstruction = new MockInstruction();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.AffirmInstructionWithCount,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const body = {
        signer,
      };

      let result = await service.affirmInstruction(new BigNumber(123), body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.affirm,
        {},
        expect.objectContaining({ signer })
      );

      mockTransactionsService.submit.mockClear();

      result = await service.affirmInstruction(new BigNumber(123), {
        ...body,
        portfolios: [new PortfolioDto({ did: '0x01', id: new BigNumber(0) })],
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.affirm,
        { portfolios: ['0x01'] },
        expect.objectContaining({ signer })
      );

      mockTransactionsService.submit.mockClear();

      const receipt = new OffChainAffirmationReceiptDto({
        legId: new BigNumber(0),
        uid: new BigNumber(1),
        signer: 'some_signer',
        signature: {
          type: SignerKeyRingType.Sr25519,
          value: '0xsomesignature',
        },
      });

      const receipt2 = new OffChainAffirmationReceiptDto({
        legId: new BigNumber(1),
        uid: new BigNumber(2),
        signer: 'some_signer2',
        signature: {
          type: SignerKeyRingType.Sr25519,
          value: '0xsomesignature2',
        },
        metadata: 'random metadata',
      });

      mockInstruction.generateOffChainAffirmationReceipt.mockResolvedValue(receipt2);

      result = await service.affirmInstruction(new BigNumber(123), {
        ...body,
        receipts: [
          receipt,
          {
            ...receipt2,
            signature: {
              type: SignerKeyRingType.Sr25519,
            },
          },
        ],
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.affirm,
        { receipts: [receipt, receipt2] },
        expect.objectContaining({ signer })
      );
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
        expect.objectContaining({ signer })
      );
    });
  });

  describe('findVenueDetails', () => {
    it('should return the Venue details', async () => {
      const mockDetails = {
        owner: {
          did,
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
    });
  });

  describe('fetchAllowedSigners', () => {
    it('should return the allowed signers for a Venue', async () => {
      const mockAccounts = [new MockAccount()];
      const mockVenue = new MockVenue();
      mockVenue.getAllowedSigners.mockResolvedValue(mockAccounts);

      const findVenueSpy = jest.spyOn(service, 'findVenue');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findVenueSpy.mockResolvedValue(mockVenue as any);

      const result = await service.fetchAllowedSigners(new BigNumber(12));

      expect(result).toEqual(mockAccounts);
    });
  });

  describe('findAffirmations', () => {
    it('should return a list of affirmations for an Instruction', async () => {
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

      const mockInstruction = new MockInstruction();
      mockInstruction.getAffirmations.mockResolvedValue(mockAffirmations);

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.findAffirmations(new BigNumber(123), new BigNumber(10));

      expect(result).toEqual(mockAffirmations);
    });
  });

  describe('getOffChainAffirmations', () => {
    it('should return a list of off chain affirmations for an Instruction', async () => {
      const mockAffirmations = [
        {
          legId: new BigNumber(0),
          status: AffirmationStatus.Pending,
        },
      ];

      const mockInstruction = new MockInstruction();
      mockInstruction.getOffChainAffirmations.mockResolvedValue(mockAffirmations);

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.fetchOffChainAffirmations(new BigNumber(12));

      expect(result).toEqual(mockAffirmations);
    });
  });

  describe('fetchOffChainAffirmationForALeg', () => {
    it('should return a list of off chain affirmations for an Instruction', async () => {
      const mockAffirmationStatus = AffirmationStatus.Affirmed;

      const mockInstruction = new MockInstruction();
      mockInstruction.getOffChainAffirmationForLeg.mockResolvedValue(mockAffirmationStatus);

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.fetchOffChainAffirmationForALeg(
        new BigNumber(12),
        new BigNumber(0)
      );

      expect(result).toEqual(mockAffirmationStatus);
    });
  });

  describe('canTransfer', () => {
    const mockTransferBreakdown = {
      general: [TransferError.SelfTransfer, TransferError.ScopeClaimMissing],
      compliance: {
        requirements: [],
        complies: false,
      },
      restrictions: [],
      result: false,
    };

    let mockAsset: MockAsset;
    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAsset.settlements.canTransfer.mockResolvedValue(mockTransferBreakdown);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
    });

    it('should return if Asset transfer is possible ', async () => {
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

    it('should return if NFT transfer is possible ', async () => {
      const result = await service.canTransfer(
        new PortfolioDto({ did: 'fromDid', id: new BigNumber(1) }).toPortfolioLike(),
        new PortfolioDto({ did: 'toDid', id: new BigNumber(2) }).toPortfolioLike(),
        'NFT',
        undefined,
        [new BigNumber(1)]
      );

      expect(result).toEqual(mockTransferBreakdown);
    });
  });

  describe('withdrawAffirmation', () => {
    it('should run a withdraw affirmation procedure and return the queue data', async () => {
      const mockInstruction = new MockInstruction();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.WithdrawAffirmation,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.withdrawAffirmation(new BigNumber(123), {
        signer,
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.withdraw,
        {},
        expect.objectContaining({ signer })
      );
    });
  });

  describe('affirmInstructionAsMediator', () => {
    it('should run an affirm procedure and return the queue data', async () => {
      const expiry = new Date();
      const mockInstruction = new MockInstruction();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.AffirmInstructionAsMediator,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const body = {
        signer,
        expiry,
      };

      const result = await service.affirmInstructionAsMediator(new BigNumber(123), body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.affirmAsMediator,
        { expiry },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('rejectInstructionAsMediator', () => {
    it('should run a reject procedure and return the queue data', async () => {
      const mockInstruction = new MockInstruction();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.RejectInstructionAsMediator,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.rejectInstructionAsMediator(new BigNumber(123), {
        signer,
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.rejectAsMediator,
        {},
        expect.objectContaining({ signer })
      );
    });
  });

  describe('withdrawAffirmationAsMediator', () => {
    it('should run a withdraw affirmation procedure and return the queue data', async () => {
      const mockInstruction = new MockInstruction();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.settlement.WithdrawAffirmationAsMediator,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const result = await service.withdrawAffirmationAsMediator(new BigNumber(123), {
        signer,
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockInstruction.withdrawAsMediator,
        {},
        expect.objectContaining({ signer })
      );
    });
  });
});
