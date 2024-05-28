import { DeepMocked } from '@golevelup/ts-jest';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ExtrinsicsOrderBy,
  Identity,
  PermissionType,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { Response } from 'express';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountDetails, AccountsService } from '~/accounts/accounts.service';
import { PermissionedAccountDto } from '~/accounts/dto/permissioned-account.dto';
import { ExtrinsicModel } from '~/common/models/extrinsic.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { PermissionsLikeDto } from '~/identities/dto/permissions-like.dto';
import * as identityUtil from '~/identities/identities.util';
import { AccountModel } from '~/identities/models/account.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
import { NetworkService } from '~/network/network.service';
import { SubsidyService } from '~/subsidy/subsidy.service';
import { extrinsic, testValues } from '~/test-utils/consts';
import {
  createMockResponseObject,
  createMockSubsidy,
  MockAsset,
  MockIdentity,
  MockPortfolio,
} from '~/test-utils/mocks';
import {
  MockAccountsService,
  mockNetworkServiceProvider,
  mockSubsidyServiceProvider,
} from '~/test-utils/service-mocks';

const { signer, did, testAccount, txResult } = testValues;

describe('AccountsController', () => {
  let controller: AccountsController;
  let mockNetworkService: DeepMocked<NetworkService>;
  const mockAccountsService = new MockAccountsService();
  let mockSubsidyService: DeepMocked<SubsidyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [AccountsService, mockNetworkServiceProvider, mockSubsidyServiceProvider],
    })
      .overrideProvider(AccountsService)
      .useValue(mockAccountsService)
      .compile();
    mockNetworkService = mockNetworkServiceProvider.useValue as DeepMocked<NetworkService>;
    mockSubsidyService = mockSubsidyServiceProvider.useValue as DeepMocked<SubsidyService>;
    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getIdentity', () => {
    it('should throw NotFoundException if no Identity is associated with the Account', () => {
      mockAccountsService.getIdentity.mockResolvedValue(null);

      return expect(() => controller.getIdentity({ account: '5xdd' })).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    describe('otherwise', () => {
      it('should return the associated DID for the given account', async () => {
        const identity = new MockIdentity();
        mockAccountsService.getIdentity.mockResolvedValue(identity);

        const result = await controller.getIdentity({ account: '5xdd' });

        expect(result).toEqual(new IdentitySignerModel({ did }));
      });
    });
  });

  describe('getAccountBalance', () => {
    it('should return the POLYX balance of an Account', async () => {
      const mockResult = {
        free: new BigNumber(10),
        locked: new BigNumber(1),
        total: new BigNumber(11),
      };
      mockAccountsService.getAccountBalance.mockResolvedValue(mockResult);

      const result = await controller.getAccountBalance({ account: '5xdd' });

      expect(result).toEqual(mockResult);
    });
  });

  describe('transferPolyx', () => {
    it('should return the transaction details on transferring POLYX balance', async () => {
      mockAccountsService.transferPolyx.mockResolvedValue(txResult);

      const body = {
        signer,
        to: 'address',
        amount: new BigNumber(10),
        memo: 'Sample memo',
      };

      const result = await controller.transferPolyx(body);

      expect(result).toEqual(txResult);
    });
  });

  describe('getTransactionHistory', () => {
    const mockTransaction = extrinsic;

    const mockTransactions = {
      data: [mockTransaction],
      next: null,
      count: new BigNumber(1),
    };

    it('should return the list of Asset documents', async () => {
      mockAccountsService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const result = await controller.getTransactionHistory(
        { account: 'someAccount' },
        { orderBy: ExtrinsicsOrderBy.CreatedAtDesc }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: [new ExtrinsicModel(mockTransaction)],
          total: new BigNumber(1),
          next: null,
        })
      );
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
        values: [new MockPortfolio()],
      },
      transactions: {
        type: PermissionType.Include,
        values: [TxTags.asset.AddDocuments],
      },
      transactionGroups: [TxGroup.Issuance, TxGroup.StoManagement],
    };

    it('should return the Account Permissions', async () => {
      mockAccountsService.getPermissions.mockResolvedValue(mockPermissions);

      const result = await controller.getPermissions({ account: 'someAccount' });

      expect(result).toEqual({
        assets: {
          type: PermissionType.Include,
          values: ['TICKER'],
        },
        portfolios: {
          type: PermissionType.Include,
          values: [
            {
              id: '1',
              did,
            },
          ],
        },
        transactions: {
          type: PermissionType.Include,
          values: [TxTags.asset.AddDocuments],
        },
        transactionGroups: [TxGroup.Issuance, TxGroup.StoManagement],
      });
    });
  });

  describe('getSubsidy', () => {
    let mockResponse: DeepMocked<Response>;

    beforeEach(() => {
      mockResponse = createMockResponseObject();
    });
    it(`should return the ${HttpStatus.NO_CONTENT} if the Account has no subsidy`, async () => {
      mockSubsidyService.getSubsidy.mockResolvedValue(null);

      await controller.getSubsidy({ account: 'someAccount' }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    });

    it('should return the Account Subsidy', async () => {
      const subsidyWithAllowance = {
        subsidy: createMockSubsidy(),
        allowance: new BigNumber(10),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSubsidyService.getSubsidy.mockResolvedValue(subsidyWithAllowance as any);

      await controller.getSubsidy({ account: 'someAccount' }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        beneficiary: new AccountModel({ address: 'beneficiary' }),
        subsidizer: new AccountModel({ address: 'subsidizer' }),
        allowance: new BigNumber(10),
      });
    });
  });

  describe('freezeSecondaryAccounts', () => {
    it('should freeze secondary accounts', async () => {
      mockAccountsService.freezeSecondaryAccounts.mockResolvedValue(txResult);
      const body = {
        signer,
      };

      const result = await controller.freezeSecondaryAccounts(body);

      expect(result).toEqual(txResult);
    });
  });

  describe('unfreezeSecondaryAccounts', () => {
    it('should unfreeze secondary accounts', async () => {
      mockAccountsService.unfreezeSecondaryAccounts.mockResolvedValue(txResult);
      const body = {
        signer,
      };

      const result = await controller.unfreezeSecondaryAccounts(body);

      expect(result).toEqual(txResult);
    });
  });

  describe('revokePermissions', () => {
    it('should call the service and return the transaction details', async () => {
      mockAccountsService.revokePermissions.mockResolvedValue(txResult);

      const body = {
        signer,
        secondaryAccounts: ['someAddress'],
      };

      const result = await controller.revokePermissions(body);

      expect(result).toEqual(txResult);
    });
  });

  describe('modifyPermissions', () => {
    it('should call the service and return the transaction details', async () => {
      mockAccountsService.modifyPermissions.mockResolvedValue(txResult);

      const body = {
        signer,
        secondaryAccounts: [
          new PermissionedAccountDto({
            secondaryAccount: 'someAddress',
            permissions: new PermissionsLikeDto({
              assets: null,
              portfolios: null,
              transactionGroups: [TxGroup.PortfolioManagement],
            }),
          }),
        ],
      };

      const result = await controller.modifyPermissions(body);

      expect(result).toEqual(txResult);
    });
  });

  describe('getTreasuryAccount', () => {
    it('should call the service and return treasury Account details', async () => {
      mockNetworkService.getTreasuryAccount.mockReturnValue(testAccount);

      const result = controller.getTreasuryAccount();

      expect(result).toEqual(new AccountModel({ address: testAccount.address }));
    });
  });

  describe('getDetails', () => {
    it('should call the service and return AccountDetailsModel', async () => {
      const fakeIdentityModel = 'fakeIdentityModel' as unknown as IdentityModel;
      jest.spyOn(identityUtil, 'createIdentityModel').mockResolvedValue(fakeIdentityModel);

      const mockResponse: AccountDetails = {
        identity: new MockIdentity() as unknown as Identity,
        multiSigDetails: null,
      };

      mockAccountsService.getDetails.mockReturnValue(mockResponse);

      const result = await controller.getAccountDetails({ account: '5xdd' });

      expect(result).toEqual({ identity: fakeIdentityModel });
    });
  });
});
