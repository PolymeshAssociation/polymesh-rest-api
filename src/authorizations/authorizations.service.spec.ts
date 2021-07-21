import { forwardRef } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationType } from '@polymathnetwork/polymesh-sdk/types';

import { IdentitiesModule } from '~/identities/identities.module';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymeshClass } from '~/test-utils/mocks';

import { MockIdentityClass } from './../test-utils/mocks';
import { AuthorizationsService } from './authorizations.service';

describe('AuthorizationsService', () => {
  let service: AuthorizationsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;
  const mockIdentitiesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [forwardRef(() => IdentitiesModule)],
      providers: [AuthorizationsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    service = module.get<AuthorizationsService>(AuthorizationsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPendingByDid', () => {
    const mockIdentity = new MockIdentityClass();
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
    const mockIdentity = new MockIdentityClass();
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
