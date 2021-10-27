/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { ErrorCode, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockIdentity,
  MockPolymesh,
  MockRelayerAccountsService,
  MockTransactionQueue,
} from '~/test-utils/mocks';

import { IdentitiesService } from './identities.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('IdentitiesService', () => {
  let service: IdentitiesService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockRelayerAccountsService: MockRelayerAccountsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockRelayerAccountsService = new MockRelayerAccountsService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, RelayerAccountsModule],
      providers: [IdentitiesService, mockPolymeshLoggerProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get<IdentitiesService>(IdentitiesService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe('if the Identity does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.getIdentity.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.DataUnavailable,
            message: 'The Identity does not exist',
          });
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne('falseDid');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
        mockIsPolymeshError.mockReset();
      });
    });
    describe('otherwise', () => {
      it('should return the Identity', async () => {
        const fakeResult = 'identity';

        mockPolymeshApi.getIdentity.mockReturnValue(fakeResult);

        const result = await service.findOne('realDid');

        expect(result).toBe(fakeResult);
      });
    });
  });

  describe('findTrustingTokens', () => {
    it('should return the list of Assets for which the Identity is a default trusted Claim Issuer', async () => {
      const mockTokens = [
        {
          ticker: 'BAR_TOKEN',
        },
        {
          ticker: 'FOO_TOKEN',
        },
      ];
      const mockIdentity = new MockIdentity();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockIdentity as any);
      mockIdentity.getTrustingTokens.mockResolvedValue(mockTokens);

      const result = await service.findTrustingTokens('TICKER');
      expect(result).toEqual(mockTokens);

      findOneSpy.mockRestore();
    });
  });

  describe('inviteAccount', () => {
    describe('if there is an error', () => {
      const errors = [
        [
          new PolymeshError({
            code: ErrorCode.FatalError,
            message: "The supplied address is not encoded with the chain's SS58 format",
          }),
          InternalServerErrorException,
        ],
        [
          new PolymeshError({
            code: ErrorCode.ValidationError,
            message: 'The target Account is already part of an Identity',
          }),
          BadRequestException,
        ],
        [
          new PolymeshError({
            code: ErrorCode.ValidationError,
            message: 'The target Account already has a pending invitation to join this Identity',
          }),
          BadRequestException,
        ],
      ];

      it('should pass the error along the chain', async () => {
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          targetAccount: 'address',
        };

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const findOneSpy = jest.spyOn(service, 'findOne');

        errors.forEach(async ([polymeshError, httpException]) => {
          const mockIdentity = new MockIdentity();
          mockIdentity.inviteAccount.mockImplementation(() => {
            throw polymeshError;
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          findOneSpy.mockResolvedValue(mockIdentity as any);
          mockIsPolymeshError.mockReturnValue(true);

          let error;
          try {
            await service.inviteAccount(body);
          } catch (err) {
            error = err;
          }

          expect(error).toBeInstanceOf(httpException);
          mockIsPolymeshError.mockReset();
          findOneSpy.mockRestore();
        });
      });
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const mockIdentity = new MockIdentity();

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockIdentity as any);

        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.identity.JoinIdentityAsKey,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockIdentity.inviteAccount.mockResolvedValue(mockQueue);

        const body = {
          signer: '0x6'.padEnd(66, '0'),
          targetAccount: 'address',
        };

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const result = await service.inviteAccount(body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.identity.JoinIdentityAsKey,
            },
          ],
        });
        expect(findOneSpy).toHaveBeenCalled();
        findOneSpy.mockRestore();
      });
    });
  });
});
