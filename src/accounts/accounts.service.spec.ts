/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Order, TransactionOrderFields } from '@polymeshassociation/polymesh-sdk/middleware/types';
import { PermissionType, TxGroup, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { PermissionedAccountDto } from '~/accounts/dto/permissioned-account.dto';
import { PermissionsLikeDto } from '~/identities/dto/permissions-like.dto';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningModule } from '~/signing/signing.module';
import { extrinsic, testValues } from '~/test-utils/consts';
import { MockAccount, MockAsset, MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import * as transactionsUtilModule from '~/transactions/transactions.util';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
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
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return the Account for valid Account address', async () => {
      const mockAccount = 'account';

      mockPolymeshApi.accountManagement.getAccount.mockResolvedValue(mockAccount);

      const result = await service.findOne('address');

      expect(result).toBe(mockAccount);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockPolymeshApi.accountManagement.getAccount.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        const address = 'address';

        await expect(() => service.findOne(address)).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
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
      data: [extrinsic],
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

    it('should return the Account Permissions for a valid address', async () => {
      mockAccount.getPermissions.mockResolvedValue(mockPermissions);

      const result = await service.getPermissions('address');

      expect(result).toEqual(mockPermissions);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockAccount.getPermissions.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.getPermissions('address')).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
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
