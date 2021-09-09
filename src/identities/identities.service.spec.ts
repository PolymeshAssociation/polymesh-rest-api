import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockIdentity, MockPolymesh } from '~/test-utils/mocks';

import { IdentitiesService } from './identities.service';

describe('IdentitiesService', () => {
  let service: IdentitiesService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [IdentitiesService, mockPolymeshLoggerProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<IdentitiesService>(IdentitiesService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe('if the Identity does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.isIdentityValid.mockResolvedValue(false);

        let error;
        try {
          await service.findOne('falseDid');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('otherwise', () => {
      it('should return the Identity', async () => {
        mockPolymeshApi.isIdentityValid.mockResolvedValue(true);

        const fakeResult = 'identity';

        mockPolymeshApi.getIdentity.mockReturnValue(fakeResult);

        const result = await service.findOne('realDid');

        expect(result).toBe(fakeResult);
      });
    });
  });

  describe('findTrustingTokens', () => {
    it('should return the list of Assets for which the Identity is a default trusted Claim Issuer', async () => {
      const mockTokens = [
        {
          ticker: 'BAR_TOKEN',
        },
        {
          ticker: 'FOO_TOKEN',
        },
      ];
      const mockIdentity = new MockIdentity();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockIdentity as any);
      mockIdentity.getTrustingTokens.mockResolvedValue(mockTokens);

      const result = await service.findTrustingTokens('TICKER');
      expect(result).toEqual(mockTokens);

      findOneSpy.mockRestore();
    });
  });
});
