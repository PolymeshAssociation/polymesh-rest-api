import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  KnownNftType,
  MetadataType,
  Nft,
  NftCollection,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { NftsService } from '~/nfts/nfts.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import { MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import { TransactionsService } from '~/transactions/transactions.service';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { ticker, signer, assetId } = testValues;

describe('NftService', () => {
  let service: NftsService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;
  let mockTransactionsService: MockTransactionsService;
  const id = new BigNumber(1);

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [NftsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    mockPolymeshApi = module.get<MockPolymesh>(POLYMESH_API);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockTransactionsService = module.get<MockTransactionsService>(TransactionsService);
    service = module.get<NftsService>(NftsService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findCollection', () => {
    it('should return the collection for a valid ticker', async () => {
      const collection = createMock<NftCollection>();
      mockPolymeshApi.assets.getNftCollection.mockResolvedValue(collection);

      const result = await service.findCollection(ticker);

      expect(result).toEqual(collection);
    });
  });

  describe('findCollection', () => {
    it('should return the collection for a valid ticker', async () => {
      const collection = createMock<NftCollection>();
      mockPolymeshApi.assets.getNftCollection.mockResolvedValue(collection);

      const result = await service.findCollection(ticker);

      expect(result).toEqual(collection);
    });

    it('should call handleSdkError and throw an error', async () => {
      const mockError = new Error('Some Error');
      mockPolymeshApi.assets.getNftCollection.mockRejectedValue(mockError);

      const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

      const address = 'address';

      await expect(() => service.findCollection(address)).rejects.toThrowError();

      expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('findNft', () => {
    it('should return the NFT for a valid ticker and id', async () => {
      const collection = createMock<NftCollection>();
      const nft = createMock<Nft>();
      mockPolymeshApi.assets.getNftCollection.mockResolvedValue(collection);
      collection.getNft.mockResolvedValue(nft);

      const result = await service.findNft(ticker, id);

      expect(result).toEqual(nft);
    });

    it('should call handleSdkError and throw an error', async () => {
      const collection = createMock<NftCollection>();
      const nft = createMock<Nft>();
      const findCollectionSpy = jest.spyOn(service, 'findCollection');
      findCollectionSpy.mockResolvedValue(collection);

      const mockError = new Error('Some Error');
      collection.getNft.mockRejectedValue(nft);

      const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

      await expect(() => service.findNft(ticker, id)).rejects.toThrowError();

      expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('nftDetails', () => {
    it('should return the details', async () => {
      const nft = createMock<Nft>({ id });
      const imageUri = 'https://example.com/nfts/1/image';
      const tokenUri = null;
      nft.getMetadata.mockResolvedValue([]);
      nft.getImageUri.mockResolvedValue(imageUri);
      nft.getTokenUri.mockResolvedValue(tokenUri);

      const findNftSpy = jest.spyOn(service, 'findNft');
      findNftSpy.mockResolvedValue(nft);

      const result = await service.nftDetails(ticker, id);
      expect(result).toEqual({
        id,
        ticker,
        imageUri,
        tokenUri,
        metadata: [],
      });
    });
  });

  describe('getCollectionKeys', () => {
    it('should return the collection keys', async () => {
      const collection = createMock<NftCollection>();
      const findCollectionSpy = jest.spyOn(service, 'findCollection');
      findCollectionSpy.mockResolvedValue(collection);

      const mockMetadata = [
        {
          type: MetadataType.Local,
          id: new BigNumber(1),
          value: 'someValue',
          name: 'some name',
          specs: {},
          assetId,
        },
      ];

      collection.collectionKeys.mockResolvedValue(mockMetadata);

      const result = await service.getCollectionKeys(ticker);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: new BigNumber(1), type: MetadataType.Local }),
        ])
      );
    });
  });

  describe('createNftCollection', () => {
    it('should create the collection', async () => {
      const input = {
        ticker,
        name: 'Collection Name',
        nftType: KnownNftType.Derivative,
        collectionKeys: [],
        signer,
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.nft.CreateNftCollection,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockCollection = createMock<NftCollection>();

      mockTransactionsService.submit.mockResolvedValue({
        result: mockCollection,
        transactions: [mockTransaction],
      });

      const result = await service.createNftCollection(input);

      expect(result).toEqual({
        result: mockCollection,
        transactions: [mockTransaction],
      });
    });
  });

  describe('issueNft', () => {
    it('should issue an NFT', async () => {
      const input = {
        signer,
        metadata: [],
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.nft.IssueNft,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockCollection = createMock<NftCollection>();
      const mockNft = createMock<Nft>();

      jest.spyOn(service, 'findCollection').mockResolvedValue(mockCollection);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockNft,
        transactions: [mockTransaction],
      });

      const result = await service.issueNft(ticker, input);

      expect(result).toEqual({
        result: mockNft,
        transactions: [mockTransaction],
      });
    });
  });

  describe('redeemNft', () => {
    it('should redeem an NFT', async () => {
      const input = {
        signer,
        from: new BigNumber(1),
      };
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.nft.RedeemNft,
      };
      const mockTransaction = new MockTransaction(mockTransactions);
      const mockCollection = createMock<NftCollection>();

      jest.spyOn(service, 'findCollection').mockResolvedValue(mockCollection);

      mockTransactionsService.submit.mockResolvedValue({
        result: undefined,
        transactions: [mockTransaction],
      });

      const result = await service.redeemNft(ticker, id, input);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });
});
