import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  CreateNftCollectionParams,
  Nft,
  NftCollection,
} from '@polymeshassociation/polymesh-sdk/types';

import { isAssetId } from '~/common/decorators';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { CreateNftCollectionDto } from '~/nfts/dto/create-nft-collection.dto';
import { IssueNftDto } from '~/nfts/dto/issue-nft.dto';
import { RedeemNftDto } from '~/nfts/dto/redeem-nft.dto';
import { CollectionKeyModel } from '~/nfts/models/collection-key.model';
import { NftModel } from '~/nfts/models/nft.model';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class NftsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async findCollection(collection: string): Promise<NftCollection> {
    let getNftCollectionPromise;
    if (isAssetId(collection)) {
      getNftCollectionPromise = this.polymeshService.polymeshApi.assets.getNftCollection({
        assetId: collection,
      });
    } else {
      getNftCollectionPromise = this.polymeshService.polymeshApi.assets.getNftCollection({
        ticker: collection,
      });
    }
    return await getNftCollectionPromise.catch(error => {
      throw handleSdkError(error);
    });
  }

  public async findNft(collection: string, id: BigNumber): Promise<Nft> {
    const nftCollection = await this.findCollection(collection);

    return nftCollection.getNft({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async nftDetails(collection: string, id: BigNumber): Promise<NftModel> {
    const nft = await this.findNft(collection, id);
    const [metadata, imageUri, tokenUri] = await Promise.all([
      nft.getMetadata(),
      nft.getImageUri(),
      nft.getTokenUri(),
    ]);

    return new NftModel({
      id: nft.id,
      collection,
      metadata,
      imageUri,
      tokenUri,
    });
  }

  public async getCollectionKeys(collection: string): Promise<CollectionKeyModel[]> {
    const nftCollection = await this.findCollection(collection);

    const keys = await nftCollection.collectionKeys();

    return keys.map(key => new CollectionKeyModel(key));
  }

  public async createNftCollection(params: CreateNftCollectionDto): ServiceReturn<NftCollection> {
    const { options, args } = extractTxOptions(params);

    const createCollection = this.polymeshService.polymeshApi.assets.createNftCollection;
    return this.transactionsService.submit(
      createCollection,
      args as CreateNftCollectionParams,
      options
    );
  }

  public async issueNft(collection: string, params: IssueNftDto): ServiceReturn<Nft> {
    const { options, args } = extractTxOptions(params);

    const { issue } = await this.findCollection(collection);

    return this.transactionsService.submit(issue, args, options);
  }

  public async redeemNft(
    collection: string,
    id: BigNumber,
    params: RedeemNftDto
  ): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const nft = await this.findNft(collection, id);

    return this.transactionsService.submit(nft.redeem, { from: toPortfolioId(args.from) }, options);
  }
}
