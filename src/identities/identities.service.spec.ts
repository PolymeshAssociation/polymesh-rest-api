/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ErrorCode, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionType } from '~/common/types';
import { IdentitiesService } from '~/identities/identities.service';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { mockSigningProvider } from '~/signing/signing.mock';
import { MockIdentity, MockPolymesh, MockTransactionQueue } from '~/test-utils/mocks';
import { MockSigningService } from '~/test-utils/service-mocks';
import { ErrorCase } from '~/test-utils/types';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('IdentitiesService', () => {
  let service: IdentitiesService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockSigningService: MockSigningService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockSigningService = mockSigningProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [IdentitiesService, mockPolymeshLoggerProvider, mockSigningProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<IdentitiesService>(IdentitiesService);
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

  describe('findOne', () => {
    describe('if the Identity does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Identity does not exist',
        };
        mockPolymeshApi.identities.getIdentity.mockImplementation(() => {
          throw mockError;
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

        mockPolymeshApi.identities.getIdentity.mockReturnValue(fakeResult);

        const result = await service.findOne('realDid');

        expect(result).toBe(fakeResult);
      });
    });
  });

  describe('findTrustingAssets', () => {
    it('should return the list of Assets for which the Identity is a default trusted Claim Issuer', async () => {
      const mockAssets = [
        {
          ticker: 'FAKE_TICKER',
        },
        {
          ticker: 'RANDOM_TICKER',
        },
      ];
      const mockIdentity = new MockIdentity();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockIdentity as any);
      mockIdentity.getTrustingAssets.mockResolvedValue(mockAssets);

      const result = await service.findTrustingAssets('TICKER');
      expect(result).toEqual(mockAssets);

      findOneSpy.mockRestore();
    });
  });

  describe('addSecondaryAccount', () => {
    describe('errors', () => {
      const cases: ErrorCase[] = [
        [
          'Invalid SS58 format',
          {
            code: ErrorCode.FatalError,
            message: "The supplied address is not encoded with the chain's SS58 format",
          },
          InternalServerErrorException,
        ],
        [
          'Target already belongs to an Identity',
          {
            code: ErrorCode.ValidationError,
            message: 'The target Account is already part of an Identity',
          },
          BadRequestException,
        ],
        [
          'The target Account has a pending invite',
          {
            code: ErrorCode.ValidationError,
            message: 'The target Account already has a pending invitation to join this Identity',
          },
          BadRequestException,
        ],
      ];

      test.each(cases)('%s', async (_, polymeshError, HttpException) => {
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          secondaryAccount: 'address',
        };

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        mockPolymeshApi.accountManagement.inviteAccount.mockImplementation(() => {
          throw polymeshError;
        });
        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.addSecondaryAccount(body);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(HttpException);
        expect(mockPolymeshApi.accountManagement.inviteAccount).toHaveBeenCalled();
        mockIsPolymeshError.mockReset();
      });
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.identity.JoinIdentityAsKey,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockPolymeshApi.accountManagement.inviteAccount.mockResolvedValue(mockQueue);

        const body = {
          signer: '0x6'.padEnd(66, '0'),
          secondaryAccount: 'address',
        };

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.addSecondaryAccount(body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.identity.JoinIdentityAsKey,
              type: TransactionType.Single,
            },
          ],
        });
        expect(mockPolymeshApi.accountManagement.inviteAccount).toHaveBeenCalled();
      });
    });
  });
});
