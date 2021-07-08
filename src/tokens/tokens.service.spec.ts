/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymeshClass, MockSecurityTokenClass } from '~/test-utils/mocks';

import { TokensService } from './tokens.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('TokensService', () => {
  let service: TokensService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [TokensService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<TokensService>(TokensService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    beforeEach(() => {
      mockIsPolymeshError.mockReturnValue(false);
    });

    afterAll(() => {
      mockIsPolymeshError.mockReset();
    });

    describe('if the token does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.getSecurityToken.mockImplementation(() => {
          throw new Error('There is no Security Token with ticker');
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findOne('TICKER');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        let expectedError = new Error('foo');
        mockPolymeshApi.getSecurityToken.mockImplementation(() => {
          throw expectedError;
        });

        let error;
        try {
          await service.findOne('TICKER');
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);

        expectedError = new Error('Something else');

        mockIsPolymeshError.mockReturnValue(true);

        error = null;
        try {
          await service.findOne('TICKER');
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return the token entity', async () => {
        const mockSecurityToken = new MockSecurityTokenClass();

        mockPolymeshApi.getSecurityToken.mockReturnValue(mockSecurityToken);

        const result = await service.findOne('TICKER');

        expect(result).toEqual(mockSecurityToken);
      });
    });
  });

  describe('findDetails', () => {
    it('should return the token details', async () => {
      const mockDetails = {
        assetType: 'assetType',
        isDivisible: false,
        name: 'name',
        owner: 'owner',
        primaryIssuanceAgent: 'pia',
        totalSupply: 'totalSupply',
      };

      const mockSecurityToken = new MockSecurityTokenClass();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.details.mockResolvedValue(mockDetails);

      const result = await service.findDetails('TICKER');

      expect(result).toEqual(mockDetails);
      findOneSpy.mockRestore();
    });
  });

  describe('findAllByOwner', () => {
    describe('if the identity does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.isIdentityValid.mockResolvedValue(false);

        let error;
        try {
          await service.findAllByOwner('TICKER');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('otherwise', () => {
      it('should return a list of security tokens', async () => {
        mockPolymeshApi.isIdentityValid.mockResolvedValue(true);

        const tokens = [{ ticker: 'FOO' }, { ticker: 'BAR' }, { ticker: 'BAZ' }];

        mockPolymeshApi.getSecurityTokens.mockResolvedValue(tokens);

        const result = await service.findAllByOwner('0x1');

        expect(result).toEqual(tokens);
      });
    });
  });
});
