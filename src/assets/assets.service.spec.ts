/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ErrorCode, KnownAssetType, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';
import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { TransactionType } from '~/common/types';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { mockSigningProvider } from '~/signing/signing.mock';
import { MockAsset, MockPolymesh, MockTransactionQueue } from '~/test-utils/mocks';
import { MockSigningService } from '~/test-utils/service-mocks';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('AssetsService', () => {
  let service: AssetsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockSigningService: MockSigningService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockSigningService = mockSigningProvider.useValue;
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [AssetsService, mockSigningProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<AssetsService>(AssetsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
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
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'There is no Asset with ticker',
        };
        mockPolymeshApi.assets.getAsset.mockImplementation(() => {
          throw mockError;
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
        mockPolymeshApi.assets.getAsset.mockImplementation(() => {
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
        const mockAsset = new MockAsset();

        mockPolymeshApi.assets.getAsset.mockReturnValue(mockAsset);

        const result = await service.findOne('TICKER');

        expect(result).toEqual(mockAsset);
      });
    });
  });

  describe('findAllByOwner', () => {
    describe('if the identity does not exist', () => {
      it('should throw a NotFoundException', async () => {
        mockPolymeshApi.identities.isIdentityValid.mockResolvedValue(false);

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
        mockPolymeshApi.identities.isIdentityValid.mockResolvedValue(true);

        const assets = [{ ticker: 'FOO' }, { ticker: 'BAR' }, { ticker: 'BAZ' }];

        mockPolymeshApi.assets.getAssets.mockResolvedValue(assets);

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
      count: new BigNumber(2),
    };

    it('should return the list of Asset holders', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.assetHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', new BigNumber(10));
      expect(result).toEqual(mockHolders);
      findOneSpy.mockRestore();
    });

    it('should return the list of Asset holders from a start value', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.assetHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', new BigNumber(10), 'NEXT_KEY');
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
          contentHash: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    it('should return the list of Asset documents', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', new BigNumber(10));
      expect(result).toEqual(mockAssetDocuments);
      findOneSpy.mockRestore();
    });

    it('should return the list of Asset documents from a start value', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', new BigNumber(10), 'NEXT_KEY');
      expect(result).toEqual(mockAssetDocuments);
      findOneSpy.mockRestore();
    });
  });

  describe('setDocuments', () => {
    it('should run a set procedure and return the queue results', async () => {
      const mockAsset = new MockAsset();
      const mockTransactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.asset.AddDocuments,
        },
      ];
      const mockQueue = new MockTransactionQueue(mockTransactions);
      mockQueue.run.mockResolvedValue(mockAsset);

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      mockAsset.documents.set.mockResolvedValue(mockQueue);

      const address = 'address';
      mockSigningService.getAddressByHandle.mockReturnValue(address);

      const body = {
        signer: 'signer',
        documents: [
          new AssetDocumentDto({
            name: 'TEST-DOC',
            uri: 'URI',
            contentHash: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
          }),
        ],
      };

      const result = await service.setDocuments('TICKER', body);
      expect(result).toEqual({
        result: mockAsset,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            blockNumber: new BigNumber(1),
            transactionTag: TxTags.asset.AddDocuments,
            type: TransactionType.Single,
          },
        ],
      });
      expect(mockAsset.documents.set).toHaveBeenCalledWith(
        { documents: body.documents },
        { signingAccount: address }
      );
      findOneSpy.mockRestore();
    });
  });

  describe('createAsset', () => {
    const createBody = {
      signer: '0x6000',
      name: 'Ticker Corp',
      ticker: 'TICKER',
      isDivisible: false,
      assetType: KnownAssetType.EquityCommon,
      requireInvestorUniqueness: false,
    };
    describe('if there is an error', () => {
      it('should pass it up the chain', async () => {
        const expectedError = new Error('Some error');

        mockPolymeshApi.assets.createAsset.mockImplementation(() => {
          throw expectedError;
        });

        mockSigningService.getAddressByHandle.mockReturnValue('address');

        let error;
        try {
          await service.createAsset(createBody);
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should create the asset', async () => {
        const mockAsset = new MockAsset();
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.asset.CreateAsset,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockQueue.run.mockResolvedValue(mockAsset);
        mockPolymeshApi.assets.createAsset.mockResolvedValue(mockQueue);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);
        const result = await service.createAsset(createBody);
        expect(result).toEqual({
          result: mockAsset,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.asset.CreateAsset,
              type: TransactionType.Single,
            },
          ],
        });
      });
    });
  });

  describe('issue', () => {
    const issueBody = {
      signer: '0x6000',
      amount: new BigNumber(1000),
    };
    it('should issue the asset', async () => {
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.asset.Issue,
        },
      ];
      const findSpy = jest.spyOn(service, 'findOne');

      const mockQueue = new MockTransactionQueue(transactions);
      const mockAsset = new MockAsset();
      mockAsset.issuance.issue.mockResolvedValue(mockQueue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const address = 'address';
      mockSigningService.getAddressByHandle.mockReturnValue(address);
      const result = await service.issue('TICKER', issueBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            blockNumber: new BigNumber(1),
            transactionTag: TxTags.asset.Issue,
            type: TransactionType.Single,
          },
        ],
      });
      findSpy.mockRestore();
    });
  });

  describe('freeze', () => {
    const freezeBody = {
      signer: '0x6000',
    };
    it('should freeze the asset', async () => {
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.asset.Freeze,
        },
      ];
      const findSpy = jest.spyOn(service, 'findOne');

      const mockQueue = new MockTransactionQueue(transactions);
      const mockAsset = new MockAsset();
      mockAsset.freeze.mockResolvedValue(mockQueue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const address = 'address';
      mockSigningService.getAddressByHandle.mockReturnValue(address);
      const result = await service.freeze('TICKER', freezeBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            blockNumber: new BigNumber(1),
            transactionTag: TxTags.asset.Freeze,
            type: TransactionType.Single,
          },
        ],
      });
      findSpy.mockRestore();
    });
  });

  describe('unfreeze', () => {
    const unfreezeBody = {
      signer: '0x6000',
    };
    it('should unfreeze the asset', async () => {
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.asset.Freeze,
        },
      ];
      const findSpy = jest.spyOn(service, 'findOne');

      const mockQueue = new MockTransactionQueue(transactions);
      const mockAsset = new MockAsset();
      mockAsset.unfreeze.mockResolvedValue(mockQueue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const address = 'address';
      mockSigningService.getAddressByHandle.mockReturnValue(address);
      const result = await service.unfreeze('TICKER', unfreezeBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            blockNumber: new BigNumber(1),
            transactionTag: TxTags.asset.Unfreeze,
            type: TransactionType.Single,
          },
        ],
      });
      findSpy.mockRestore();
    });
  });
});
