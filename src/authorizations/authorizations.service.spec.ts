import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationType } from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesService } from '~/identities/identities.service';
import { MockIdentity } from '~/test-utils/mocks';

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
          type: AuthorizationType.NoData,
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
      const result = await service.findPendingByDid(did, true, AuthorizationType.NoData);
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
});
