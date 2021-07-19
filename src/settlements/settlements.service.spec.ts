/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { PortfolioDto } from '~/common/dto/portfolio.dto';
import { IdentitiesModule } from '~/identities/identities.module';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockIdentityClass,
  MockInstructionClass,
  MockPolymeshClass,
  MockRelayerAccountsService,
  MockTransactionQueueClass,
  MockVenueClass,
} from '~/test-utils/mocks';

import { SettlementsService } from './settlements.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('SettlementsService', () => {
  let service: SettlementsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;
  const mockIdentitiesService = {
    findOne: jest.fn(),
  };
  const mockRelayerAccountsService = new MockRelayerAccountsService();

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [IdentitiesModule, PolymeshModule, RelayerAccountsModule],
      providers: [SettlementsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
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
      const mockIdentity = new MockIdentityClass();
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
          throw new Error("The Instruction doesn't");
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
      it('should return the token entity', async () => {
        const mockInstruction = new MockInstructionClass();

        mockPolymeshApi.settlements.getInstruction.mockResolvedValue(mockInstruction);

        const expectedStatus = 'status';
        mockInstruction.getStatus.mockResolvedValue(expectedStatus);

        const result = await service.findInstruction(new BigNumber('123'));

        expect(result).toEqual(expectedStatus);
      });
    });
  });

  describe('createInstruction', () => {
    describe('if the venue does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.settlements.getVenue.mockImplementation(() => {
          throw new Error('The Venue');
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await service.createInstruction(new BigNumber('123'), {} as any);
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await service.createInstruction(new BigNumber('123'), {} as any);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await service.createInstruction(new BigNumber('123'), {} as any);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should run an addInstruction procedure and return the queue data', async () => {
        const mockVenue = new MockVenueClass();

        mockPolymeshApi.settlements.getVenue.mockResolvedValue(mockVenue);

        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.settlement.AddInstruction,
          },
        ];
        const mockQueue = new MockTransactionQueueClass(transactions);
        const mockInstruction = 'instruction';
        mockQueue.run.mockResolvedValue(mockInstruction);
        mockVenue.addInstruction.mockResolvedValue(mockQueue);

        const params = {
          legs: [
            {
              from: new PortfolioDto({ did: 'fromDid' }),
              to: new PortfolioDto({ did: 'toDid' }),
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
          { legs: [{ from: 'fromDid', to: 'toDid' }] },
          { signer: address }
        );
      });
    });
  });

  describe('affirmInstruction', () => {
    describe('if the instruction does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.settlements.getInstruction.mockImplementation(() => {
          throw new Error("The Instruction doesn't exist");
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await service.affirmInstruction(new BigNumber('123'), {} as any);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if there is a different error when fetching the instruction', () => {
      it('should pass the error along the chain', async () => {
        let expectedError = new Error('foo');
        mockPolymeshApi.settlements.getInstruction.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await service.affirmInstruction(new BigNumber('123'), {} as any);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await service.affirmInstruction(new BigNumber('123'), {} as any);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should run an affirm procedure and return the queue data', async () => {
        const mockInstruction = new MockInstructionClass();

        mockPolymeshApi.settlements.getInstruction.mockResolvedValue(mockInstruction);

        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.settlement.AffirmInstruction,
          },
        ];
        const mockQueue = new MockTransactionQueueClass(transactions);
        mockInstruction.affirm.mockResolvedValue(mockQueue);

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
      });
    });
  });
});
