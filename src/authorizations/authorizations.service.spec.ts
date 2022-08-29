/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AuthorizationType, ErrorCode, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { TransactionType } from '~/common/types';
import { IdentitiesService } from '~/identities/identities.service';
import { mockSigningProvider } from '~/signing/signing.mock';
import { MockAuthorizationRequest, MockIdentity, MockTransaction } from '~/test-utils/mocks';
import { MockIdentitiesService, MockSigningService } from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('AuthorizationsService', () => {
  let service: AuthorizationsService;

  const mockIdentitiesService = new MockIdentitiesService();

  let mockSigningService: MockSigningService;

  beforeEach(async () => {
    mockSigningService = mockSigningProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationsService, IdentitiesService, mockSigningProvider],
    })
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
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
    const did = '0x6'.padEnd(66, '0');
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
    const did = '0x6'.padEnd(66, '0');
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
    beforeEach(() => {
      mockIsPolymeshError.mockReturnValue(false);
      mockIdentity = new MockIdentity();
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
    });

    afterAll(() => {
      mockIsPolymeshError.mockReset();
    });

    describe('if the AuthorizationRequest does not exist', () => {
      it('should throw a NotFoundException', () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Authorization Request does not exist',
        };

        mockIdentity.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        return expect(() => service.findOne('TICKER', new BigNumber(1))).rejects.toBeInstanceOf(
          NotFoundException
        );
      });
    });

    describe('if there is a different error', () => {
      it('should pass the error along the chain', () => {
        const mockError = new Error('foo');
        mockIdentity.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        return expect(() => service.findOne('TICKER', new BigNumber(1))).rejects.toThrowError(
          mockError
        );
      });
    });

    describe('otherwise', () => {
      it('should return the AuthorizationRequest details', async () => {
        const mockAuthorization = new MockAuthorizationRequest();
        mockIdentity.authorizations.getOne.mockResolvedValue(mockAuthorization);

        const result = await service.findOne('0x6'.padEnd(66, '0'), new BigNumber(1));
        expect(result).toEqual(mockAuthorization);
      });
    });
  });

  describe('accept', () => {
    let mockAuthorizationRequest: MockAuthorizationRequest;

    beforeEach(() => {
      mockAuthorizationRequest = new MockAuthorizationRequest();
      mockSigningService.getAddressByHandle.mockReturnValue('address');
    });
    describe('if there is an error', () => {
      it('should pass it up the chain', async () => {
        const expectedError = new Error('Some error');

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockAuthorizationRequest as any);

        mockAuthorizationRequest.accept.mockImplementation(() => {
          throw expectedError;
        });

        await expect(() => service.accept(new BigNumber(1), '0x6000')).rejects.toThrowError(
          expectedError
        );
        findOneSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should call the accept procedure and return the queue data', async () => {
        const transactions = {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.portfolio.AcceptPortfolioCustody,
        };

        const mockTransaction = new MockTransaction(transactions);

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockAuthorizationRequest as any);

        mockAuthorizationRequest.accept.mockResolvedValue(mockTransaction);

        const result = await service.accept(new BigNumber(1), '0x6000');
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.portfolio.AcceptPortfolioCustody,
              type: TransactionType.Single,
            },
          ],
        });
      });
    });
  });

  describe('remove', () => {
    let mockAuthorizationRequest: MockAuthorizationRequest;

    beforeEach(() => {
      mockAuthorizationRequest = new MockAuthorizationRequest();
      mockSigningService.getAddressByHandle.mockReturnValue('address');
    });

    describe('if there is an error', () => {
      it('should pass it up the chain', async () => {
        const expectedError = new Error('Some error');

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockAuthorizationRequest as any);

        mockAuthorizationRequest.remove.mockImplementation(() => {
          throw expectedError;
        });

        await expect(() => service.remove(new BigNumber(1), '0x6000')).rejects.toThrowError(
          expectedError
        );
        findOneSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should call the remove procedure and return the queue data', async () => {
        const transactions = {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.identity.RemoveAuthorization,
        };
        const mockTransaction = new MockTransaction(transactions);

        const findOneSpy = jest.spyOn(service, 'findOne');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findOneSpy.mockResolvedValue(mockAuthorizationRequest as any);

        mockAuthorizationRequest.remove.mockResolvedValue(mockTransaction);

        const result = await service.remove(new BigNumber(2), '0x6000');
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.identity.RemoveAuthorization,
              type: TransactionType.Single,
            },
          ],
        });
      });
    });
  });
});
