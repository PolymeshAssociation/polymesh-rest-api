/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Order, TransactionOrderFields } from '@polymeshassociation/polymesh-sdk/middleware/types';
import {
  ErrorCode,
  PermissionType,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { PermissionedAccountDto } from '~/accounts/dto/permissioned-account.dto';
import { PermissionsLikeDto } from '~/identities/dto/permissions-like.dto';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningModule } from '~/signing/signing.module';
import { testValues } from '~/test-utils/consts';
import {
  MockAccount,
  MockAsset,
  MockPolymesh,
  MockSubsidy,
  MockTransaction,
} from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

const { signer } = testValues;

describe('AccountsService', () => {
  let service: AccountsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockTransactionsService = mockTransactionsProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, SigningModule],
      providers: [AccountsService, mockTransactionsProvider],
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
    it('should return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.balances.TransferWithMemo,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockPolymeshApi.network.transferPolyx.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const body = {
        signer,
        to: 'address',
        amount: new BigNumber(10),
        memo: 'Sample memo',
      };

      const result = await service.transferPolyx(body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.network.transferPolyx,
        { amount: new BigNumber(10), memo: 'Sample memo', to: 'address' },
        { signer }
      );
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

  describe('getSubsidy', () => {
    const mockSubsidyWithAllowance = {
      subsidy: new MockSubsidy(),
      allowance: new BigNumber(10),
    };

    let findOneSpy: jest.SpyInstance;
    let mockAccount: MockAccount;

    beforeEach(() => {
      mockAccount = new MockAccount();
      findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAccount as any);
    });

    it('should return the Account Subsidy', async () => {
      mockAccount.getSubsidy.mockResolvedValue(mockSubsidyWithAllowance);

      const result = await service.getSubsidy('address');

      expect(result).toEqual(mockSubsidyWithAllowance);

      findOneSpy.mockRestore();
    });
  });

  describe('freezeSecondaryAccounts', () => {
    it('should return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.FreezeSecondaryKeys,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockPolymeshApi.accountManagement.freezeSecondaryAccounts.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const body = {
        signer,
      };

      const result = await service.freezeSecondaryAccounts(body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.accountManagement.freezeSecondaryAccounts,
        undefined,
        { signer }
      );
    });
  });

  describe('unfreezeSecondaryAccounts', () => {
    it('should return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.FreezeSecondaryKeys,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockPolymeshApi.accountManagement.unfreezeSecondaryAccounts.mockResolvedValue(
        mockTransaction
      );
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const body = {
        signer,
      };

      const result = await service.unfreezeSecondaryAccounts(body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.accountManagement.unfreezeSecondaryAccounts,
        undefined,
        { signer }
      );
    });
  });

  describe('revokePermissions', () => {
    it('should return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.SetPermissionToSigner,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockPolymeshApi.accountManagement.revokePermissions.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const secondaryAccounts = ['someAddress'];
      const body = {
        signer,
        secondaryAccounts,
      };

      const result = await service.revokePermissions(body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.accountManagement.revokePermissions,
        { secondaryAccounts },
        { signer }
      );
    });
  });

  describe('modifyPermissions', () => {
    it('should return the transaction details', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.SetPermissionToSigner,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockPolymeshApi.accountManagement.modifyPermissions.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const account = 'someAddress';
      const permissions = {
        assets: null,
        portfolios: null,
        transactionGroups: [TxGroup.PortfolioManagement],
      };
      const secondaryAccounts = [
        new PermissionedAccountDto({
          secondaryAccount: account,
          permissions: new PermissionsLikeDto(permissions),
        }),
      ];
      const body = {
        signer,
        secondaryAccounts,
      };

      const result = await service.modifyPermissions(body);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.accountManagement.modifyPermissions,
        { secondaryAccounts: [{ account, permissions }] },
        { signer }
      );
    });
  });
});
