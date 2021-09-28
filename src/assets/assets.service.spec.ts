/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { GoneException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import {
  ClaimType,
  ConditionType,
  ErrorCode,
  KnownTokenType,
  ScopeType,
  TxTags,
} from '@polymathnetwork/polymesh-sdk/types';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import {
  MockPolymesh,
  MockRelayerAccountsService,
  MockSecurityToken,
  MockTickerReservation,
  MockTransactionQueue,
} from '~/test-utils/mocks';

import { AssetsService } from './assets.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('AssetsService', () => {
  let service: AssetsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockRelayerAccountsService: MockRelayerAccountsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockRelayerAccountsService = new MockRelayerAccountsService();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, RelayerAccountsModule],
      providers: [AssetsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
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
          throw new PolymeshError({
            code: ErrorCode.DataUnavailable,
            message: 'There is no Security Token with ticker',
          });
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
        const mockSecurityToken = new MockSecurityToken();

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
      const mockSecurityToken = new MockSecurityToken();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.tokenHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', 10);
      expect(result).toEqual(mockHolders);
      findOneSpy.mockRestore();
    });

    it('should return the list of Asset holders from a start value', async () => {
      const mockSecurityToken = new MockSecurityToken();

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
          contentHash: '0x'.padEnd(130, 'a'),
        },
      ],
      next: '0xddddd',
      count: 2,
    };

    it('should return the list of Asset documents', async () => {
      const mockSecurityToken = new MockSecurityToken();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', 10);
      expect(result).toEqual(mockAssetDocuments);
      findOneSpy.mockRestore();
    });

    it('should return the list of Asset documents from a start value', async () => {
      const mockSecurityToken = new MockSecurityToken();

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

      const mockSecurityToken = new MockSecurityToken();

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

      const mockSecurityToken = new MockSecurityToken();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockSecurityToken as any);
      mockSecurityToken.compliance.trustedClaimIssuers.get.mockResolvedValue(mockClaimIssuers);

      const result = await service.findTrustedClaimIssuers('TICKER');

      expect(result).toEqual(mockClaimIssuers);
      findOneSpy.mockRestore();
    });
  });

  describe('findTickerReservation', () => {
    describe('if the reservation does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.getTickerReservation.mockImplementation(() => {
          throw new PolymeshError({
            message: 'There is no reservation for',
            code: ErrorCode.FatalError,
          });
        });
        mockIsPolymeshError.mockReturnValue(true);
        let error;
        try {
          await service.findTickerReservation('BRK.A');
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if the asset has already been created', () => {
      it('should throw a GoneException', async () => {
        mockPolymeshApi.getTickerReservation.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.FatalError,
            message: 'BRK.A token has been created',
          });
        });
        mockIsPolymeshError.mockReturnValue(true);
        let error;
        try {
          await service.findTickerReservation('BRK.A');
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(GoneException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('Something else');
        mockPolymeshApi.getTickerReservation.mockImplementation(() => {
          throw expectedError;
        });
        mockIsPolymeshError.mockReturnValue(true);
        let error;
        try {
          await service.findTickerReservation('BRK.A');
        } catch (err) {
          error = err;
        }
        expect(error).toBe(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return the reservation', async () => {
        const mockTickerReservation = {
          ticker: 'BRK.A',
        };
        mockPolymeshApi.getTickerReservation.mockResolvedValue(mockTickerReservation);
        const result = await service.findTickerReservation('BRK.A');
        expect(result).toEqual(mockTickerReservation);
      });
    });
  });
  describe('createAsset', () => {
    describe('if there is an error', () => {
      it('should pass it up the chain', async () => {
        const expectedError = new Error('Some error');
        const mockTickerReservation = new MockTickerReservation();

        const findTickerReservationSpy = jest.spyOn(service, 'findTickerReservation');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findTickerReservationSpy.mockResolvedValue(mockTickerReservation as any);

        mockTickerReservation.createToken.mockImplementation(() => {
          throw expectedError;
        });

        const body = {
          signer: '0x6000',
          name: 'Berkshire Class A',
          ticker: 'BRK.A',
          isDivisible: false,
          assetType: KnownTokenType.EquityCommon,
        };

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
        let error;
        try {
          await service.createAsset(body);
        } catch (err) {
          error = err;
        }
        expect(error).toEqual(expectedError);
        findTickerReservationSpy.mockRestore();
      });
    });
    describe('otherwise', () => {
      it('should create the asset', async () => {
        const mockTickerReservation = new MockTickerReservation();

        const findTickerReservationSpy = jest.spyOn(service, 'findTickerReservation');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findTickerReservationSpy.mockResolvedValue(mockTickerReservation as any);

        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.asset.CreateAsset,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockTickerReservation.createToken.mockResolvedValue(mockQueue);

        const body = {
          signer: '0x6000',
          name: 'Berkshire Class A',
          ticker: 'BRK.A',
          isDivisible: false,
          assetType: KnownTokenType.EquityCommon,
        };

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
        const result = await service.createAsset(body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.asset.CreateAsset,
            },
          ],
        });
        findTickerReservationSpy.mockRestore();
      });
    });
    it('will reserve the ticker if its not already reserved', async () => {
      const mockTickerReservation = new MockTickerReservation();

      const findTickerReservationSpy = jest.spyOn(service, 'findTickerReservation');
      findTickerReservationSpy.mockImplementation(() => {
        throw new NotFoundException('There is no reservation for "BRK.A"');
      });

      const registerTransaction = [
        {
          blockHash: '0x2',
          txHash: '0x4',
          tag: TxTags.asset.RegisterTicker,
        },
      ];
      const registerTickerSpy = jest.spyOn(service, 'registerTicker');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockResult: any = {
        transactions: registerTransaction,
        result: mockTickerReservation,
      };
      registerTickerSpy.mockResolvedValue(mockResult);

      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.asset.CreateAsset,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      mockTickerReservation.createToken.mockResolvedValue(mockQueue);

      const body = {
        signer: '0x6000',
        name: 'Berkshire Class A',
        ticker: 'BRK.A',
        isDivisible: false,
        assetType: KnownTokenType.EquityCommon,
      };

      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
      const result = await service.createAsset(body);
      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x2',
            txHash: '0x4',
            tag: TxTags.asset.RegisterTicker,
          },
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.asset.CreateAsset,
          },
        ],
      });
      expect(registerTickerSpy).toHaveBeenCalled();
      findTickerReservationSpy.mockRestore();
      registerTickerSpy.mockRestore();
    });
  });

  describe('issueAsset', () => {
    const body = {
      signer: '0x6000',
      amount: new BigNumber(1000),
    };
    it('should issue the asset', async () => {
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          tag: TxTags.asset.Issue,
        },
      ];
      const findSpy = jest.spyOn(service, 'findOne');

      const mockQueue = new MockTransactionQueue(transactions);
      const mockAsset = {
        issuance: { issue: jest.fn().mockResolvedValue(mockQueue) },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const address = 'address';
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
      const result = await service.issue('TICKER', body);
      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            transactionTag: TxTags.asset.Issue,
          },
        ],
      });
      findSpy.mockRestore();
    });
  });

  describe('registerTicker', () => {
    describe('otherwise', () => {
      it('should register the ticker', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.asset.RegisterTicker,
          },
        ];

        const mockQueue = new MockTransactionQueue(transactions);
        mockPolymeshApi.reserveTicker.mockResolvedValue(mockQueue);

        const body = {
          signer: '0x6000',
          ticker: 'BRK.A',
        };

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);
        const result = await service.registerTicker(body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.asset.RegisterTicker,
            },
          ],
        });
      });
    });
  });
});
