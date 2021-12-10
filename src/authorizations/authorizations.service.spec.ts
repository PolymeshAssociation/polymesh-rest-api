/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { AuthorizationType, ErrorCode } from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesService } from '~/identities/identities.service';
import { MockAuthorizationRequest, MockIdentity } from '~/test-utils/mocks';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('AuthorizationsService', () => {
  let service: AuthorizationsService;
  const mockIdentitiesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationsService, IdentitiesService],
    })
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    service = module.get<AuthorizationsService>(AuthorizationsService);
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
      count: 15,
    };
    mockIdentity.authorizations.getSent.mockResolvedValue(mockIssuedAuthorizations);

    it('should return a list of issued Authorizations', async () => {
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findIssuedByDid(did, 1);
      expect(result).toEqual(mockIssuedAuthorizations);
    });

    it('should return a list of issued Authorizations from start key', async () => {
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findIssuedByDid(did, 1, '0x41bc3');
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
      it('should throw a NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Authorization Request does not exist',
        };

        mockIdentity.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne('TICKER', new BigNumber(1));
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });

    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const mockError = new Error('foo');
        mockIdentity.authorizations.getOne.mockImplementation(() => {
          throw mockError;
        });

        let error;
        try {
          await service.findOne('TICKER', new BigNumber(1));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(mockError);
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
});
