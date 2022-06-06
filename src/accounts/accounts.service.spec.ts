/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Order, TransactionOrderFields } from '@polymathnetwork/polymesh-sdk/middleware/types';
import { ErrorCode, PermissionType, TxGroup, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { TransactionType } from '~/common/types';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { mockSigningProvider } from '~/signing/signing.mock';
import { SigningModule } from '~/signing/signing.module';
import { MockAccount, MockAsset, MockPolymesh, MockTransactionQueue } from '~/test-utils/mocks';
import { MockSigningService } from '~/test-utils/service-mocks';
import { ErrorCase } from '~/test-utils/types';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('AccountsService', () => {
  let service: AccountsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockSigningService: MockSigningService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockSigningService = mockSigningProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, SigningModule],
      providers: [AccountsService, mockSigningProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<AccountsService>(AccountsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
    mockIsPolymeshError.mockReset();
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe("if the Account address is not encoded with the chain's SS58 format", () => {
      it('should throw a BadRequestException', async () => {
        const mockError = {
          code: ErrorCode.ValidationError,
          message: "The supplied address is not encoded with the chain's SS58 format",
        };

        const ss58Format = new BigNumber(42);
        mockPolymeshApi.network.getSs58Format.mockReturnValue(ss58Format);

        mockPolymeshApi.accountManagement.getAccount.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        const address = 'address';

        const expectedError = await expect(() => service.findOne(address)).rejects;
        expectedError.toBeInstanceOf(BadRequestException);
        expectedError.toThrowError(
          `The address "${address}" is not encoded with the chain's SS58 format "${ss58Format.toString()}"`
        );
      });
    });

    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('Something else');

        mockPolymeshApi.accountManagement.getAccount.mockImplementation(() => {
          throw expectedError;
        });

        return expect(() => service.findOne('address')).rejects.toThrowError('Something else');
      });
    });

    describe('otherwise', () => {
      it('should return the Account', async () => {
        const mockAccount = 'account';

        mockPolymeshApi.accountManagement.getAccount.mockReturnValue(mockAccount);

        const result = await service.findOne('address');

        expect(result).toBe(mockAccount);
      });
    });
  });

  describe('getAccountBalance', () => {
    it('should return the POLYX balance of an Account', async () => {
      const fakeBalance = 'balance';

      mockPolymeshApi.accountManagement.getAccountBalance.mockReturnValue(fakeBalance);

      const result = await service.getAccountBalance('fakeAccount');

      expect(result).toBe(fakeBalance);
    });
  });

  describe('transferPolyx', () => {
    describe('errors', () => {
      const cases: ErrorCase[] = [
        [
          'Insufficient free balance',
          {
            code: ErrorCode.InsufficientBalance,
            message: 'Insufficient free balance',
            data: {
              freeBalance: new BigNumber(10),
            },
          },
          UnprocessableEntityException,
        ],
        [
          'Destination Account without any Identity',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: "The destination Account doesn't have an associated Identity",
          },
          UnprocessableEntityException,
        ],
        [
          'Invalid CDD claim with receiver Identity',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The receiver Identity has an invalid CDD claim',
          },
          UnprocessableEntityException,
        ],
      ];

      test.each(cases)('%s', async (_, polymeshError, HttpException) => {
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          to: 'address',
          amount: new BigNumber(10),
          memo: 'Sample memo',
        };

        const someKey = 'someKey';
        mockSigningService.getAddressByHandle.mockReturnValue(someKey);

        mockPolymeshApi.network.transferPolyx.mockImplementation(() => {
          throw polymeshError;
        });
        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.transferPolyx(body);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(HttpException);
        expect(mockPolymeshApi.network.transferPolyx).toHaveBeenCalled();
      });
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.balances.TransferWithMemo,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockPolymeshApi.network.transferPolyx.mockResolvedValue(mockQueue);

        const body = {
          signer: '0x6'.padEnd(66, '0'),
          to: 'address',
          amount: new BigNumber(10),
          memo: 'Sample memo',
        };

        const keyName = 'someKey';
        mockSigningService.getAddressByHandle.mockReturnValue(keyName);

        const result = await service.transferPolyx(body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.balances.TransferWithMemo,
              type: TransactionType.Single,
            },
          ],
        });
        expect(mockPolymeshApi.network.transferPolyx).toHaveBeenCalled();
      });
    });
  });

  describe('getTransactionHistory', () => {
    const mockTransactions = {
      data: [
        {
          blockHash: 'blockHash',
          blockNumber: new BigNumber(1000000),
          extrinsicIdx: new BigNumber(1),
          address: 'someAccount',
          nonce: new BigNumber(123456),
          txTag: TxTags.asset.RegisterTicker,
          params: [
            {
              name: 'ticker',
              value: 'TICKER',
            },
          ],
          success: true,
          specVersionId: new BigNumber(3002),
          extrinsicHash: 'extrinsicHash',
        },
      ],
      next: null,
      count: new BigNumber(1),
    };

    it('should return the transaction history of the Asset', async () => {
      const mockAccount = new MockAccount();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAccount as any);
      mockAccount.getTransactionHistory.mockResolvedValue(mockTransactions);

      const result = await service.getTransactionHistory('address', {
        field: TransactionOrderFields.BlockId,
        order: Order.Desc,
      });
      expect(result).toEqual(mockTransactions);
      findOneSpy.mockRestore();
    });
  });

  describe('getPermissions', () => {
    const mockPermissions = {
      assets: {
        type: PermissionType.Include,
        values: [new MockAsset()],
      },
      portfolios: {
        type: PermissionType.Include,
        values: [],
      },
      transactions: {
        type: PermissionType.Include,
        values: [TxTags.asset.AddDocuments],
      },
      transactionGroups: [TxGroup.Issuance, TxGroup.StoManagement],
    };

    let findOneSpy: jest.SpyInstance;
    let mockAccount: MockAccount;

    beforeEach(() => {
      mockAccount = new MockAccount();
      findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAccount as any);
    });

    describe('if the Account address is not associated with any Identity', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'There is no Identity associated with Account',
        };

        mockAccount.getPermissions.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        const address = 'address';

        const expectedError = await expect(() => service.getPermissions(address)).rejects;

        expectedError.toBeInstanceOf(NotFoundException);
        expectedError.toThrowError(`There is no Identity associated with Account "${address}"`);

        findOneSpy.mockRestore();
      });
    });

    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('Something else');

        mockAccount.getPermissions.mockImplementation(() => {
          throw expectedError;
        });

        await expect(() => service.getPermissions('address')).rejects.toThrowError(
          'Something else'
        );

        findOneSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should return the Account Permissions', async () => {
        mockAccount.getPermissions.mockResolvedValue(mockPermissions);

        const result = await service.getPermissions('address');

        expect(result).toEqual(mockPermissions);

        findOneSpy.mockRestore();
      });
    });
  });
});
