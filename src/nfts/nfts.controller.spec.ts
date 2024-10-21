import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { KnownNftType, Nft, NftCollection } from '@polymeshassociation/polymesh-sdk/types';

import { ServiceReturn } from '~/common/utils';
import { NftsController } from '~/nfts//nfts.controller';
import { CollectionKeyModel } from '~/nfts/models/collection-key.model';
import { NftModel } from '~/nfts/models/nft.model';
import { NftsService } from '~/nfts/nfts.service';
import { processedTxResult, testValues } from '~/test-utils/consts';
import { mockNftsServiceProvider } from '~/test-utils/service-mocks';

const { signer, ticker, txResult, assetId } = testValues;

describe('NftController', () => {
  let controller: NftsController;
  let mockNftsService: DeepMocked<NftsService>;
  const id = new BigNumber(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NftsController],
      providers: [mockNftsServiceProvider],
    }).compile();

    mockNftsService = module.get<typeof mockNftsService>(NftsService);
    controller = module.get<NftsController>(NftsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCollectionKeys', () => {
    it('should call the service and return the result', async () => {
      const fakeResult = ['fakeResult'] as unknown as CollectionKeyModel[];

      mockNftsService.getCollectionKeys.mockResolvedValue(fakeResult);

      const result = await controller.getCollectionKeys({ asset: assetId });

      expect(result).toEqual(fakeResult);
    });
  });

  describe('getNftInfo', () => {
    it('should call the service and return the result', async () => {
      const fakeResult = 'fakeNftModel' as unknown as NftModel;

      mockNftsService.nftDetails.mockResolvedValue(fakeResult);

      const result = await controller.getNftDetails({ asset: assetId, id });

      expect(result).toEqual(fakeResult);
    });
  });

  describe('createNftCollection', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
        name: 'Ticker Collection',
        ticker,
        nftType: KnownNftType.Derivative,
        collectionKeys: [],
      };
      mockNftsService.createNftCollection.mockResolvedValue(
        txResult as unknown as ServiceReturn<NftCollection>
      );

      const result = await controller.createNftCollection(input);
      expect(result).toEqual(processedTxResult);
    });
  });

  describe('issueNft', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
        metadata: [],
      };
      const fakeResult = processedTxResult as unknown as ServiceReturn<Nft>;
      mockNftsService.issueNft.mockResolvedValue(fakeResult);

      const result = await controller.issueNft({ asset: assetId }, input);
      expect(result).toEqual(fakeResult);
    });
  });

  describe('redeemNft', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
        from: new BigNumber(0),
      };
      const fakeResult = processedTxResult as unknown as ServiceReturn<void>;
      mockNftsService.redeemNft.mockResolvedValue(fakeResult);

      const result = await controller.redeem({ asset: assetId, id }, input);
      expect(result).toEqual(fakeResult);
    });
  });
});
