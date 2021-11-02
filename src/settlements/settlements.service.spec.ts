/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import {
  AffirmationStatus,
  ErrorCode,
  TransferError,
  TxTags,
  VenueType,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockIdentity,
  MockInstruction,
  MockPolymesh,
  MockRelayerAccountsService,
  MockSecurityToken,
  MockTransactionQueue,
  MockVenue,
} from '~/test-utils/mocks';

import { SettlementsService } from './settlements.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('SettlementsService', () => {
  let service: SettlementsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  const mockIdentitiesService = {
    findOne: jest.fn(),
    findOneByAddress: jest.fn(),
  };
  const mockAssetsService = {
    findOne: jest.fn(),
  };
  const mockRelayerAccountsService = new MockRelayerAccountsService();

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [IdentitiesModule, PolymeshModule, RelayerAccountsModule],
      providers: [SettlementsService, AssetsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get<SettlementsService>(SettlementsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockIsPolymeshError.mockReturnValue(false);
  });

  afterAll(() => {
    mockIsPolymeshError.mockReset();
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
        mockPolymeshApi.settlements.getInstruction.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.ValidationError,
            message: "The Instruction doesn't",
          });
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findInstruction(new BigNumber('123'));
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
          await service.findInstruction(new BigNumber('123'));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          await service.findInstruction(new BigNumber('123'));
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
        const result = await service.findInstruction(new BigNumber('123'));
        expect(result).toEqual(mockInstruction);
      });
    });
  });

  describe('findVenue', () => {
    describe('if the Venue does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.settlements.getVenue.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.ValidationError,
            message: "The Venue doesn't",
          });
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findVenue(new BigNumber('123'));
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
          await service.findVenue(new BigNumber('123'));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          await service.findVenue(new BigNumber('123'));
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
        const result = await service.findVenue(new BigNumber('123'));
        expect(result).toEqual(mockVenue);
      });
    });
  });

  describe('createInstruction', () => {
    it('should run an addInstruction procedure and return the queue data', async () => {
      const mockVenue = new MockVenue();

      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.settlement.AddInstruction,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      const mockInstruction = 'instruction';
      mockQueue.run.mockResolvedValue(mockInstruction);
      mockVenue.addInstruction.mockResolvedValue(mockQueue);

      const findVenueSpy = jest.spyOn(service, 'findVenue');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findVenueSpy.mockResolvedValue(mockVenue as any);

      const params = {
        legs: [
          {
            from: new PortfolioDto({ did: 'fromDid', id: new BigNumber(0) }),
            to: new PortfolioDto({ did: 'toDid', id: new BigNumber(1) }),
            amount: new BigNumber(100),
            asset: 'TOKEN',
          },
        ],
      };
      const body = {
        signer: 'signer',
        ...params,
      };
      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await service.createInstruction(new BigNumber('123'), body as any);

      expect(result).toEqual({
        result: mockInstruction,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.settlement.AddInstruction,
          },
        ],
      });
      expect(mockVenue.addInstruction).toHaveBeenCalledWith(
        {
          legs: [
            {
              from: 'fromDid',
              to: { identity: 'toDid', id: new BigNumber(1) },
              amount: new BigNumber(100),
              token: 'TOKEN',
            },
          ],
        },
        { signer: address }
      );
      findVenueSpy.mockRestore();
    });
  });

  describe('createVenue', () => {
    it('should run a createVenue procedure and return the queue data', async () => {
      const mockIdentity = new MockIdentity();

      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.settlement.CreateVenue,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockIdentity.createVenue.mockResolvedValue(mockQueue);
      mockIdentitiesService.findOneByAddress.mockResolvedValue(mockIdentity);

      const body = {
        signer: '0x6'.padEnd(66, '0'),
        details: 'A generic exchange',
        type: VenueType.Exchange,
      };
      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

      const result = await service.createVenue(body);

      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.settlement.CreateVenue,
          },
        ],
      });
      expect(mockIdentity.createVenue).toHaveBeenCalledWith(
        { details: body.details, type: body.type },
        { signer: address }
      );
    });
  });

  describe('modifyVenue', () => {
    describe('if there is an error when updating the venue', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('New type is the same as the current one');
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          type: VenueType.Exchange,
          description: 'A generic exchange',
        };
        const mockVenue = new MockVenue();
        mockVenue.modify.mockImplementation(() => {
          throw expectedError;
        });
        const findVenueSpy = jest.spyOn(service, 'findVenue');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findVenueSpy.mockResolvedValue(mockVenue as any);

        mockIsPolymeshError.mockReturnValue(true);

        let error = null;
        try {
          await service.modifyVenue(new BigNumber('123'), body);
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

        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.settlement.UpdateVenueType,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockVenue.modify.mockResolvedValue(mockQueue);

        const body = {
          signer: '0x6'.padEnd(66, '0'),
          description: 'A generic exchange',
          type: VenueType.Exchange,
        };
        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const result = await service.modifyVenue(new BigNumber('123'), body);

        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.settlement.UpdateVenueType,
            },
          ],
        });
        expect(mockVenue.modify).toHaveBeenCalledWith(
          { description: body.description, type: body.type },
          { signer: address }
        );
        findVenueSpy.mockRestore();
      });
    });
  });

  describe('affirmInstruction', () => {
    it('should run an affirm procedure and return the queue data', async () => {
      const mockInstruction = new MockInstruction();
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.settlement.AffirmInstruction,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockInstruction.affirm.mockResolvedValue(mockQueue);

      const findInstructionSpy = jest.spyOn(service, 'findInstruction');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findInstructionSpy.mockResolvedValue(mockInstruction as any);

      const body = {
        signer: 'signer',
      };
      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await service.affirmInstruction(new BigNumber('123'), body as any);

      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.settlement.AffirmInstruction,
          },
        ],
      });
      expect(mockInstruction.affirm).toHaveBeenCalledWith(undefined, { signer: address });
      findInstructionSpy.mockRestore();
    });
  });

  describe('findVenueDetails', () => {
    it('should return the Venue details', async () => {
      const mockDetails = {
        owner: {
          did: '0x6'.padEnd(66, '0'),
        },
        description: 'Venue desc',
        type: VenueType.Distribution,
      };
      const mockVenue = new MockVenue();
      mockVenue.details.mockResolvedValue(mockDetails);

      const findVenueSpy = jest.spyOn(service, 'findVenue');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findVenueSpy.mockResolvedValue(mockVenue as any);

      const result = await service.findVenueDetails(new BigNumber('123'));

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
              did: '0x6'.padEnd(66, '0'),
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

      const result = await service.findAffirmations(new BigNumber('123'), 10);

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

      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.settlements.canTransfer.mockResolvedValue(mockTransferBreakdown);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.canTransfer(
        new PortfolioDto({ did: 'fromDid', id: new BigNumber(1) }).toPortfolioLike(),
        new PortfolioDto({ did: 'toDid', id: new BigNumber(2) }).toPortfolioLike(),
        'TICKER',
        new BigNumber('123')
      );

      expect(result).toEqual(mockTransferBreakdown);
    });
  });
});
