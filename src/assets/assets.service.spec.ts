/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ClaimType, ConditionType, ScopeType } from '@polymathnetwork/polymesh-sdk/types';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymeshClass, MockSecurityTokenClass } from '~/test-utils/mocks';

import { AssetsService } from './assets.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('AssetsService', () => {
  let service: AssetsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [AssetsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<AssetsService>(AssetsService);
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

    describe('if the Asset does not exist', () => {
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
      it('should return the Asset', async () => {
        const mockSecurityToken = new MockSecurityTokenClass();

        mockPolymeshApi.getSecurityToken.mockReturnValue(mockSecurityToken);

        const result = await service.findOne('TICKER');

        expect(result).toEqual(mockSecurityToken);
      });
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
      it('should return a list of Assets', async () => {
        mockPolymeshApi.isIdentityValid.mockResolvedValue(true);

        const assets = [{ ticker: 'FOO' }, { ticker: 'BAR' }, { ticker: 'BAZ' }];

        mockPolymeshApi.getSecurityTokens.mockResolvedValue(assets);

        const result = await service.findAllByOwner('0x1');

        expect(result).toEqual(assets);
      });
    });
  });

  describe('findHolders', () => {
    const mockHolders = {
      data: [
        {
          identity: '0x6'.padEnd(66, '0'),
          balance: new BigNumber(1),
        },
      ],
      next: '0xddddd',
      count: 2,
    };

    it('should return the list of Asset holders', async () => {
      const mockSecurityToken = new MockSecurityTokenClass();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.tokenHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', 10);
      expect(result).toEqual(mockHolders);
      findOneSpy.mockRestore();
    });

    it('should return the list of Asset holders from a start value', async () => {
      const mockSecurityToken = new MockSecurityTokenClass();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.tokenHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', 10, 'NEXTKEY');
      expect(result).toEqual(mockHolders);
      findOneSpy.mockRestore();
    });
  });

  describe('findDocuments', () => {
    const mockAssetDocuments = {
      data: [
        {
          name: 'TEST-DOC',
          uri: 'URI',
          contentHash: 'None',
        },
      ],
      next: '0xddddd',
      count: 2,
    };

    it('should return the list of Asset documents', async () => {
      const mockSecurityToken = new MockSecurityTokenClass();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', 10);
      expect(result).toEqual(mockAssetDocuments);
      findOneSpy.mockRestore();
    });

    it('should return the list of Asset documents from a start value', async () => {
      const mockSecurityToken = new MockSecurityTokenClass();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', 10, 'NEXTKEY');
      expect(result).toEqual(mockAssetDocuments);
      findOneSpy.mockRestore();
    });
  });

  describe('findComplianceRequirements', () => {
    it('should return the list of Asset compliance requirements', async () => {
      const mockRequirements = [
        {
          id: 1,
          conditions: [
            {
              type: ConditionType.IsPresent,
              claim: {
                type: ClaimType.Accredited,
                scope: {
                  type: ScopeType.Identity,
                  value: 'Ox6'.padEnd(66, '0'),
                },
              },
              target: 'Receiver',
              trustedClaimIssuers: [],
            },
          ],
        },
      ];

      const mockSecurityToken = new MockSecurityTokenClass();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.compliance.requirements.get.mockResolvedValue(mockRequirements);

      const result = await service.findComplianceRequirements('TICKER');

      expect(result).toEqual(mockRequirements);
      findOneSpy.mockRestore();
    });
  });

  describe('findTrustedClaimIssuers', () => {
    it('should return the list of trusted Claim Issuers of an Asset', async () => {
      const mockClaimIssuers = [
        {
          did: 'Ox6'.padEnd(66, '0'),
          trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
        },
      ];

      const mockSecurityToken = new MockSecurityTokenClass();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.compliance.trustedClaimIssuers.get.mockResolvedValue(mockClaimIssuers);

      const result = await service.findTrustedClaimIssuers('TICKER');

      expect(result).toEqual(mockClaimIssuers);
      findOneSpy.mockRestore();
    });
  });
});
