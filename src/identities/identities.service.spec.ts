/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Asset,
  CustomPermissionGroup,
  Identity,
  ReceiverAffirmationRequirement,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';
import { RegisterIdentityDto } from '~/identities/dto/register-identity.dto';
import { IdentitiesService } from '~/identities/identities.service';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { mockSigningProvider } from '~/signing/signing.mock';
import { testValues } from '~/test-utils/consts';
import {
  createMockTxResult,
  MockIdentity,
  MockPolymesh,
  MockTransaction,
} from '~/test-utils/mocks';
import {
  MockAccountsService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';
import {
  expectLastSubmitCall,
  expectTransactionResult,
  setupMockTransaction,
  testServiceTransactionResult,
} from '~/test-utils/test-helpers';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { signer, did } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

jest.mock('@polkadot/keyring', () => ({
  ...jest.requireActual('@polkadot/keyring'),
  Keyring: jest.fn().mockImplementation(() => {
    return {
      addFromUri: jest.fn(),
    };
  }),
}));

describe('IdentitiesService', () => {
  let service: IdentitiesService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;
  const mockAccountsService = new MockAccountsService();

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockTransactionsService = mockTransactionsProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [
        IdentitiesService,
        AccountsService,
        mockPolymeshLoggerProvider,
        mockSigningProvider,
        mockTransactionsProvider,
      ],
    })
      .overrideProvider(AccountsService)
      .useValue(mockAccountsService)
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
    it('should return the Identity for a valid DID', async () => {
      const fakeResult = 'identity';

      mockPolymeshApi.identities.getIdentity.mockResolvedValue(fakeResult);

      const result = await service.findOne('realDid');

      expect(result).toBe(fakeResult);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockPolymeshApi.identities.getIdentity.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        await expect(() => service.findOne('invalidDID')).rejects.toThrow();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
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
    });
  });

  describe('findHeldAssets', () => {
    it('should return the list of Assets held by an Identity', async () => {
      const mockAssets = {
        data: [
          {
            ticker: 'TICKER',
          },
          {
            ticker: 'TICKER2',
          },
        ],
        next: new BigNumber(2),
        count: new BigNumber(2),
      };
      const mockIdentity = new MockIdentity();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockIdentity as any);
      mockIdentity.getHeldAssets.mockResolvedValue(mockAssets);

      const result = await service.findHeldAssets('0x01', new BigNumber(2), new BigNumber(0));
      expect(result).toEqual(mockAssets);
    });
  });

  describe('addSecondaryAccount', () => {
    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const body = {
          signer,
          secondaryAccount: 'address',
        };

        await testServiceTransactionResult(
          service.addSecondaryAccount.bind(service),
          mockTransactionsService,
          body,
          TxTags.identity.JoinIdentityAsKey
        );
      });

      it('should handle undefined permissions', async () => {
        const mockTransaction = setupMockTransaction(
          mockTransactionsService,
          TxTags.identity.JoinIdentityAsKey
        );

        const body = {
          signer,
          secondaryAccount: 'address',
          permissions: undefined,
        };

        const result = await service.addSecondaryAccount(body);
        expectTransactionResult(result, mockTransaction);
        expectLastSubmitCall(mockTransactionsService, {
          permissions: undefined,
        });
      });

      it('should handle null permissions', async () => {
        const mockTransaction = setupMockTransaction(
          mockTransactionsService,
          TxTags.identity.JoinIdentityAsKey
        );

        const body = {
          signer,
          secondaryAccount: 'address',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          permissions: null as any,
        };

        const result = await service.addSecondaryAccount(body);
        expectTransactionResult(result, mockTransaction);
        expectLastSubmitCall(mockTransactionsService, {
          permissions: undefined,
        });
      });

      it('should call toPermissionsLike when permissions is defined', async () => {
        const mockTransaction = setupMockTransaction(
          mockTransactionsService,
          TxTags.identity.JoinIdentityAsKey
        );

        const { PermissionsLikeDto } = await import('~/identities/dto/permissions-like.dto');
        const mockPermissions = new PermissionsLikeDto({
          assets: null,
          portfolios: null,
          transactions: null,
          transactionGroups: [],
        });
        const toPermissionsLikeSpy = jest.spyOn(mockPermissions, 'toPermissionsLike');

        const body = {
          signer,
          secondaryAccount: 'address',
          permissions: mockPermissions,
        };

        const result = await service.addSecondaryAccount(body);
        expectTransactionResult(result, mockTransaction);
        expect(toPermissionsLikeSpy).toHaveBeenCalled();
      });
    });
  });

  describe('registerDid', () => {
    it('should return the transaction details', async () => {
      const body: RegisterIdentityDto = {
        signer,
        targetAccount: 'address',
        createCdd: false,
      };

      await testServiceTransactionResult(
        service.registerDid.bind(service),
        mockTransactionsService,
        body,
        TxTags.identity.CddRegisterDid
      );
    });

    it('should map secondaryAccounts with permissions', async () => {
      const mockTransaction = setupMockTransaction(
        mockTransactionsService,
        TxTags.identity.CddRegisterDid
      );

      const { PermissionedAccountDto } = await import('~/accounts/dto/permissioned-account.dto');
      const { PermissionsLikeDto } = await import('~/identities/dto/permissions-like.dto');

      const body: RegisterIdentityDto = {
        signer,
        targetAccount: 'address',
        createCdd: false,
        secondaryAccounts: [
          new PermissionedAccountDto({
            secondaryAccount: 'secondaryAddress',
            permissions: new PermissionsLikeDto({
              assets: null,
              portfolios: null,
              transactions: null,
              transactionGroups: [],
            }),
          }),
        ],
      };

      const result = await service.registerDid(body);
      expectTransactionResult(result, mockTransaction);
      expectLastSubmitCall(mockTransactionsService, {
        secondaryAccounts: [
          {
            secondaryAccount: 'secondaryAddress',
            permissions: expect.anything(),
          },
        ],
      });
    });

    it('should handle secondaryAccounts with undefined permissions', async () => {
      const mockTransaction = setupMockTransaction(
        mockTransactionsService,
        TxTags.identity.CddRegisterDid
      );

      // Use plain object to bypass DTO validation and allow undefined permissions
      const body = {
        signer,
        targetAccount: 'address',
        createCdd: false,
        secondaryAccounts: [
          {
            secondaryAccount: 'secondaryAddress',
            permissions: undefined,
          },
        ],
      } as unknown as RegisterIdentityDto;

      const result = await service.registerDid(body);
      expectTransactionResult(result, mockTransaction);
      expectLastSubmitCall(mockTransactionsService, {
        secondaryAccounts: [
          {
            secondaryAccount: 'secondaryAddress',
            permissions: undefined,
          },
        ],
      });
    });

    it('should handle secondaryAccounts with null permissions', async () => {
      const mockTransaction = setupMockTransaction(
        mockTransactionsService,
        TxTags.identity.CddRegisterDid
      );

      // Use plain object to bypass DTO validation and allow null permissions
      const body = {
        signer,
        targetAccount: 'address',
        createCdd: false,
        secondaryAccounts: [
          {
            secondaryAccount: 'secondaryAddress',
            permissions: null,
          },
        ],
      } as unknown as RegisterIdentityDto;

      const result = await service.registerDid(body);
      expectTransactionResult(result, mockTransaction);
      expectLastSubmitCall(mockTransactionsService, {
        secondaryAccounts: [
          {
            secondaryAccount: 'secondaryAddress',
            permissions: undefined,
          },
        ],
      });
    });
  });

  describe('selfRegisterDid', () => {
    it('should submit selfRegisterDid and return transaction details', async () => {
      const transaction = {
        txHash: '0x2',
        blockHash: '0x1',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.SelfRegisterDid,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.selfRegisterDid({ signer });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.identities.selfRegisterDid,
        undefined,
        expect.objectContaining({ signer })
      );
    });
  });

  describe('setMandatoryReceiverAffirmation', () => {
    it('should submit setMandatoryReceiverAffirmation on the identity', async () => {
      const mockIdentity = createMock<Identity>({
        setMandatoryReceiverAffirmation: jest.fn(),
      });
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.CddRegisterDid,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockIdentity);

      const requirement = ReceiverAffirmationRequirement.Required;
      const result = await service.setMandatoryReceiverAffirmation(did, { signer, requirement });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockIdentity.setMandatoryReceiverAffirmation,
        { requirement },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('rotatePrimaryKey', () => {
    it('should return the transaction details', async () => {
      const txResult = createMockTxResult(TxTags.identity.AddAuthorization);

      mockTransactionsService.submit.mockResolvedValue(txResult);

      const body = {
        signer,
        targetAccount: 'address',
      };

      const result = await service.rotatePrimaryKey(body);
      expect(result).toEqual(txResult);
      expect(mockTransactionsService.submit).toHaveBeenCalled();
    });
  });

  describe('attestPrimaryKeyRotation', () => {
    it('should return the transaction details', async () => {
      const txResult = createMockTxResult(TxTags.identity.AddAuthorization);

      mockTransactionsService.submit.mockResolvedValue(txResult);

      const mockIdentity = new MockIdentity();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockIdentity as any);

      const body = {
        signer,
        targetAccount: 'address',
      };

      const result = await service.attestPrimaryKeyRotation(mockIdentity.did, body);
      expect(result).toEqual(txResult);
      expect(mockTransactionsService.submit).toHaveBeenCalled();
    });
  });

  describe('isAssetPreApproved', () => {
    it('should return if the asset is pre-approved', async () => {
      const mockIdentity = new MockIdentity();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIdentity as any);
      mockIdentity.isAssetPreApproved.mockResolvedValue(true);

      const result = await service.isAssetPreApproved('0x01', 'TICKER');
      expect(result).toEqual(true);
    });
  });

  describe('getPreApprovedAssets', () => {
    it('should return the pre-approved assets', async () => {
      const mockAssets = {
        data: [
          {
            ticker: 'TICKER',
          },
          {
            ticker: 'TICKER2',
          },
        ],
        next: new BigNumber(2),
        count: new BigNumber(2),
      };
      const mockIdentity = new MockIdentity();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIdentity as any);
      mockIdentity.preApprovedAssets.mockResolvedValue(mockAssets);

      const result = await service.getPreApprovedAssets('0x01', new BigNumber(2));
      expect(result).toEqual(mockAssets);
    });
  });

  describe('getPendingDistributions', () => {
    it('should return the Dividend Distributions associated with an Asset that have not been claimed', async () => {
      const mockDistributions = [new MockDistributionWithDetails()];

      const mockIdentity = new MockIdentity();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockIdentity as any);
      mockIdentity.getPendingDistributions.mockResolvedValue(mockDistributions);

      const result = await service.getPendingDistributions(did);

      expect(result).toEqual(mockDistributions);
    });
  });

  describe('findDidExternalAgentOf', () => {
    it('should return the list of AssetsGroups for which the Identity has permissions', async () => {
      const asset = createMock<Asset>({
        id: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
      });
      const assetGroups = [
        { asset, group: createMock<CustomPermissionGroup>({ id: new BigNumber(1), asset }) },
      ];
      const mockIdentity = createMock<Identity>({
        did,
        assetPermissions: { get: jest.fn().mockResolvedValue(assetGroups) },
      });

      const findOneSpy = jest.spyOn(service, 'findOne');
      findOneSpy.mockResolvedValue(mockIdentity);

      const result = await service.findDidExternalAgentOf(did);
      expect(result).toEqual(assetGroups);
    });
  });
});
