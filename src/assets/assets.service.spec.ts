/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { KnownAssetType, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';
import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { testValues } from '~/test-utils/consts';
import {
  MockAsset,
  MockAuthorizationRequest,
  MockPolymesh,
  MockTransaction,
} from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { did, signer } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('AssetsService', () => {
  let service: AssetsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockTransactionsService = mockTransactionsProvider.useValue;
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [AssetsService, mockTransactionsProvider],
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
    it('should return the Asset for a valid ticker', async () => {
      const mockAsset = new MockAsset();

      mockPolymeshApi.assets.getAsset.mockResolvedValue(mockAsset);

      const result = await service.findOne('TICKER');

      expect(result).toEqual(mockAsset);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockPolymeshApi.assets.getAsset.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        const address = 'address';

        await expect(() => service.findOne(address)).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
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
          identity: did,
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
    });

    it('should return the list of Asset holders from a start value', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.assetHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', new BigNumber(10), 'NEXT_KEY');
      expect(result).toEqual(mockHolders);
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
    });

    it('should return the list of Asset documents from a start value', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', new BigNumber(10), 'NEXT_KEY');
      expect(result).toEqual(mockAssetDocuments);
    });
  });

  describe('setDocuments', () => {
    it('should run a set procedure and return the queue results', async () => {
      const mockAsset = new MockAsset();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.AddDocuments,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockAsset,
        transactions: [mockTransaction],
      });

      const body = {
        signer,
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
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.documents.set,
        { documents: body.documents },
        { signer }
      );
    });
  });

  describe('createAsset', () => {
    const createBody = {
      signer,
      name: 'Ticker Corp',
      ticker: 'TICKER',
      isDivisible: false,
      assetType: KnownAssetType.EquityCommon,
      requireInvestorUniqueness: false,
    };

    it('should create the asset', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.CreateAsset,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        result: mockAsset,
        transactions: [mockTransaction],
      });

      const result = await service.createAsset(createBody);
      expect(result).toEqual({
        result: mockAsset,
        transactions: [mockTransaction],
      });
    });
  });

  describe('issue', () => {
    const issueBody = {
      signer,
      amount: new BigNumber(1000),
    };
    it('should issue the asset', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Issue,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.issue('TICKER', issueBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('transferOwnership', () => {
    const ticker = 'TICKER';
    const body = {
      signer,
      target: '0x1000',
      expiry: new Date(),
    };

    it('should run a transferOwnership procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.AddAuthorization,
      };
      const mockResult = new MockAuthorizationRequest();

      const mockTransaction = new MockTransaction(transaction);
      mockTransaction.run.mockResolvedValue(mockResult);

      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({
        result: mockResult,
        transactions: [mockTransaction],
      });

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      const result = await service.transferOwnership(ticker, body);
      expect(result).toEqual({
        result: mockResult,
        transactions: [mockTransaction],
      });
    });
  });

  describe('redeem', () => {
    const amount = new BigNumber(1000);
    const from = new BigNumber(1);
    const redeemBody = {
      signer,
      amount,
      from,
    };

    it('should run a redeem procedure and return the queue results', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Redeem,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      when(mockTransactionsService.submit)
        .calledWith(mockAsset.redeem, { amount, from }, { signer })
        .mockResolvedValue({ transactions: [mockTransaction] });

      let result = await service.redeem('TICKER', redeemBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      when(mockTransactionsService.submit)
        .calledWith(mockAsset.redeem, { amount }, { signer })
        .mockResolvedValue({ transactions: [mockTransaction] });

      result = await service.redeem('TICKER', { ...redeemBody, from: new BigNumber(0) });
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('freeze', () => {
    const freezeBody = {
      signer,
    };
    it('should freeze the asset', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Freeze,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.freeze('TICKER', freezeBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('unfreeze', () => {
    const unfreezeBody = {
      signer,
    };
    it('should unfreeze the asset', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Unfreeze,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.unfreeze('TICKER', unfreezeBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('controllerTransfer', () => {
    it('should run a controllerTransfer procedure and return the queue results', async () => {
      const origin = new PortfolioDto({ id: new BigNumber(1), did });
      const amount = new BigNumber(100);

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.ControllerTransfer,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockAsset.controllerTransfer.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.controllerTransfer('TICKER', { signer, origin, amount });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.controllerTransfer,
        {
          originPortfolio: {
            identity: did,
            id: new BigNumber(1),
          },
          amount,
        },
        { signer }
      );
    });
  });

  describe('getOperationHistory', () => {
    it("should return the Asset's operation history", async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      const mockOperations = [
        {
          identity: {
            did: 'Ox6'.padEnd(66, '0'),
          },
          history: [
            {
              blockNumber: new BigNumber(123),
              blockHash: 'blockHash',
              blockDate: new Date('07/11/2022'),
              eventIndex: new BigNumber(1),
            },
          ],
        },
      ];
      mockAsset.getOperationHistory.mockResolvedValue(mockOperations);

      const result = await service.getOperationHistory('TICKER');
      expect(result).toEqual(mockOperations);
    });
  });
});
