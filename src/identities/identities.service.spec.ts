/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { ErrorCode } from '@polymathnetwork/polymesh-sdk/types';

import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockAccount, MockIdentity, MockPolymesh } from '~/test-utils/mocks';

import { IdentitiesService } from './identities.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

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
        mockPolymeshApi.getIdentity.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.DataUnavailable,
            message: 'The Identity does not exist',
          });
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne('falseDid');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
        mockIsPolymeshError.mockReset();
      });
    });
    describe('otherwise', () => {
      it('should return the Identity', async () => {
        const fakeResult = 'identity';

        mockPolymeshApi.getIdentity.mockReturnValue(fakeResult);

        const result = await service.findOne('realDid');

        expect(result).toBe(fakeResult);
      });
    });
  });

  describe('findOneByAddress', () => {
    describe('if the Identity does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockAccount = new MockAccount();
        mockAccount.getIdentity.mockReturnValue(null);
        mockPolymeshApi.getAccount.mockImplementation(() => {
          return mockAccount;
        });

        let error;
        try {
          await service.findOneByAddress('5abc');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });

    describe('otherwise', () => {
      it('should return the Identity', async () => {
        const fakeResult = 'identity';
        const mockAccount = new MockAccount();
        mockAccount.getIdentity.mockReturnValue(fakeResult);
        mockPolymeshApi.getAccount.mockImplementation(() => {
          return mockAccount;
        });

        const result = await service.findOneByAddress('5abc');
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
