import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { ErrorCode } from '@polymathnetwork/polymesh-sdk/types';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { MockPolymeshClass, MockSecurityTokenClass } from '~/test-utils/mocks';

import { TokensService } from './tokens.service';

describe('TokensService', () => {
  let service: TokensService;
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe('if the token does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.getSecurityToken.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.FatalError,
            message: 'There is no Security Token with ticker',
          });
        });

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

        expectedError = new PolymeshError({
          code: ErrorCode.FatalError,
          message: 'Something else',
        });

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
      it('should return the token details', async () => {
        const mockDetails = {
          assetType: 'assetType',
          isDivisible: false,
          name: 'name',
          owner: 'owner',
          primaryIssuanceAgent: 'pia',
          totalSupply: 'totalSupply',
        };
        const { primaryIssuanceAgent: pia, ...expected } = mockDetails;

        const expectedDetails = {
          ...expected,
          pia,
        };

        const mockSecurityToken = new MockSecurityTokenClass();
        mockSecurityToken.details.mockReturnValue(mockDetails);

        mockPolymeshApi.getSecurityToken.mockReturnValue(mockSecurityToken);

        const result = await service.findOne('TICKER');

        expect(result).toEqual(expectedDetails);
      });
    });
  });

  describe('findAllByOwner', () => {
    it('should return a list of security tokens', async () => {
      const tokens = ['FOO, BAR, BAZ'];
      const expectedResult = {
        results: tokens,
      };
      mockPolymeshApi.getSecurityTokens.mockResolvedValue(tokens.map(ticker => ({ ticker })));

      const result = await service.findAllByOwner('0x1');

      expect(result).toEqual(expectedResult);
    });
  });
});
