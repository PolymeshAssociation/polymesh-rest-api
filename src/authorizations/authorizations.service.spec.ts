/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AuthorizationType, ErrorCode, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AccountsService } from '~/accounts/accounts.service';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesService } from '~/identities/identities.service';
import { testDid, testSigner as signer } from '~/test-utils/consts';
import {
  MockAccount,
  MockAuthorizationRequest,
  MockIdentity,
  MockTransaction,
} from '~/test-utils/mocks';
import {
  MockAccountsService,
  MockIdentitiesService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('AuthorizationsService', () => {
  let service: AuthorizationsService;

  const mockIdentitiesService = new MockIdentitiesService();
  const mockAccountsService = new MockAccountsService();

  let mockTransactionsService: MockTransactionsService;

  beforeEach(async () => {
    mockTransactionsService = mockTransactionsProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationsService,
        IdentitiesService,
        AccountsService,
        mockTransactionsProvider,
      ],
    })
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .overrideProvider(AccountsService)
      .useValue(mockAccountsService)
      .compile();

    service = module.get<AuthorizationsService>(AuthorizationsService);
    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPendingByDid', () => {
    const mockIdentity = new MockIdentity();
    const did = testDid;
    const mockAuthorizations = [
      {
        id: '1',
        expiry: null,
        data: {
          type: AuthorizationType.PortfolioCustody,
          value: {
            did: '0x6'.padEnd(66, '1a1a'),
            id: '1',
          },
        },
        issuer: {
          did: '0x6'.padEnd(66, '1a1a'),
        },
        target: {
          type: 'Identity',
          value: did,
        },
      },
    ];
    mockIdentity.authorizations.getReceived.mockResolvedValue(mockAuthorizations);

    it('should return a list of pending Authorizations', async () => {
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findPendingByDid(did);
      expect(result).toEqual(mockAuthorizations);
    });

    it('should return a list of pending Authorizations by whether they have expired or not', async () => {
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findPendingByDid(did, false);
      expect(result).toEqual(mockAuthorizations);
    });

    it('should return a list of pending Authorizations by authorization type', async () => {
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findPendingByDid(did, true, AuthorizationType.PortfolioCustody);
      expect(result).toEqual(mockAuthorizations);
    });
  });

  describe('findIssuedByDid', () => {
    const mockIdentity = new MockIdentity();
    const did = testDid;
    const mockIssuedAuthorizations = {
      data: [
        {
          id: '1',
          expiry: null,
          data: {
            type: 'TransferCorporateActionAgent',
            value: 'TEST',
          },
          issuer: {
            did,
          },
          target: {
            type: 'Account',
            value: '5GNWrbft4pJcYSak9tkvUy89e2AKimEwHb6CKaJq81KHEj8e',
          },
        },
      ],
      next: '0x450a3',
      count: new BigNumber(15),
    };
    mockIdentity.authorizations.getSent.mockResolvedValue(mockIssuedAuthorizations);

    it('should return a list of issued Authorizations', async () => {
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findIssuedByDid(did);
      expect(result).toEqual(mockIssuedAuthorizations);
    });
  });

  describe('findOne', () => {
    let mockIdentity: MockIdentity;
    let mockAccount: MockAccount;

    beforeEach(() => {
      mockIsPolymeshError.mockReturnValue(false);
      mockIdentity = new MockIdentity();
      mockAccount = new MockAccount();
    });

    afterAll(() => {
      mockIsPolymeshError.mockReset();
    });

    describe('if the AuthorizationRequest does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Authorization Request does not exist',
        };

        mockIdentity.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        await expect(() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          service.findOne(mockIdentity as any, new BigNumber(1))
        ).rejects.toBeInstanceOf(NotFoundException);

        mockAccount.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        await expect(() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          service.findOne(mockAccount as any, new BigNumber(1))
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });

    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const mockError = new Error('foo');
        mockIdentity.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        await expect(() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          service.findOne(mockIdentity as any, new BigNumber(1))
        ).rejects.toThrowError(mockError);

        mockAccount.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        await expect(() =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          service.findOne(mockAccount as any, new BigNumber(1))
        ).rejects.toThrowError(mockError);
      });
    });

    describe('otherwise', () => {
      it('should return the AuthorizationRequest details', async () => {
        const mockAuthorization = new MockAuthorizationRequest();
        mockIdentity.authorizations.getOne.mockResolvedValue(mockAuthorization);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result = await service.findOne(mockIdentity as any, new BigNumber(1));
        expect(result).toEqual(mockAuthorization);

        mockAccount.authorizations.getOne.mockResolvedValue(mockAuthorization);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await service.findOne(mockAccount as any, new BigNumber(1));
        expect(result).toEqual(mockAuthorization);
      });
    });
  });

  describe('findOneByDid', () => {
    it('should return the AuthorizationRequest details', async () => {
      const mockIdentity = new MockIdentity();
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

      const mockAuthorization = new MockAuthorizationRequest();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAuthorization as any);

      const result = await service.findOneByDid(signer, new BigNumber(1));
      expect(result).toEqual(mockAuthorization);
    });
  });

  describe('getAuthRequest', () => {
    let mockAccount: MockAccount;
    let mockIdentity: MockIdentity;
    let mockAuthorizationRequest: MockAuthorizationRequest;
    let address: string;
    let id: BigNumber;
    let findOneSpy: jest.SpyInstance;

    beforeEach(() => {
      address = 'address';
      id = new BigNumber(1);
      mockAccount = new MockAccount();
      mockIdentity = new MockIdentity();
      mockAuthorizationRequest = new MockAuthorizationRequest();
      mockAccountsService.findOne.mockResolvedValue(mockAccount);
      findOneSpy = jest.spyOn(service, 'findOne');
    });

    it('should throw an error if AuthorizationRequest does not exist for a given ID', async () => {
      mockAccount.getIdentity.mockResolvedValue(mockIdentity);

      const mockError = new Error('foo');
      when(findOneSpy)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .calledWith(mockIdentity as any, id)
        .mockRejectedValue(mockError);

      await expect(() => service.getAuthRequest(address, id)).rejects.toThrowError(mockError);

      when(findOneSpy)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .calledWith(mockIdentity as any, id)
        .mockRejectedValue(new NotFoundException());

      when(findOneSpy)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .calledWith(mockAccount as any, id)
        .mockRejectedValue(new NotFoundException());

      await expect(() => service.getAuthRequest(address, id)).rejects.toBeInstanceOf(
        NotFoundException
      );

      findOneSpy.mockRestore();
    });

    it('should return an AuthorizationRequest targeted to an Identity', async () => {
      mockAccount.getIdentity.mockResolvedValue(mockIdentity);

      when(findOneSpy)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .calledWith(mockIdentity as any, id)
        .mockResolvedValue(mockAuthorizationRequest);

      const result = await service.getAuthRequest(address, id);
      expect(result).toBe(mockAuthorizationRequest);

      findOneSpy.mockRestore();
    });

    it('should return an AuthorizationRequest targeted to an Account', async () => {
      mockAccount.getIdentity.mockResolvedValue(null);

      when(findOneSpy)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .calledWith(mockAccount as any, id)
        .mockResolvedValue(mockAuthorizationRequest);

      let result = await service.getAuthRequest(address, id);
      expect(result).toBe(mockAuthorizationRequest);

      mockAccount.getIdentity.mockResolvedValue(mockIdentity);

      when(findOneSpy)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .calledWith(mockIdentity as any, id)
        .mockRejectedValue(new NotFoundException());

      result = await service.getAuthRequest(address, id);
      expect(result).toBe(mockAuthorizationRequest);
    });
  });

  describe('accept', () => {
    it('should call the accept procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.portfolio.AcceptPortfolioCustody,
      };

      const mockTransaction = new MockTransaction(transaction);
      const mockAuthorizationRequest = new MockAuthorizationRequest();

      const getAuthRequestSpy = jest.spyOn(service, 'getAuthRequest');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getAuthRequestSpy.mockResolvedValue(mockAuthorizationRequest as any);

      mockTransactionsService.getSigningAccount.mockResolvedValue('address');
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.accept(new BigNumber(1), '0x6000');
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      getAuthRequestSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should call the remove procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.RemoveAuthorization,
      };

      const mockTransaction = new MockTransaction(transaction);

      const mockAuthorizationRequest = new MockAuthorizationRequest();

      const getAuthRequestSpy = jest.spyOn(service, 'getAuthRequest');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getAuthRequestSpy.mockResolvedValue(mockAuthorizationRequest as any);

      mockTransactionsService.getSigningAccount.mockResolvedValue('address');
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.remove(new BigNumber(2), '0x6000');
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
      getAuthRequestSpy.mockRestore();
    });
  });
});
