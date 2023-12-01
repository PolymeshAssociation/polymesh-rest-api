import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  CreateNftCollectionParams,
  Nft,
  NftCollection,
} from '@polymeshassociation/polymesh-sdk/types';

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

  public async findCollection(ticker: string): Promise<NftCollection> {
    return this.polymeshService.polymeshApi.assets.getNftCollection({ ticker }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async findNft(ticker: string, id: BigNumber): Promise<Nft> {
    const collection = await this.findCollection(ticker);

    return collection.getNft({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async nftDetails(ticker: string, id: BigNumber): Promise<NftModel> {
    const nft = await this.findNft(ticker, id);
    const [metadata, imageUri, tokenUri] = await Promise.all([
      nft.getMetadata(),
      nft.getImageUri(),
      nft.getTokenUri(),
    ]);

    return new NftModel({
      id: nft.id,
      ticker,
      metadata,
      imageUri,
      tokenUri,
    });
  }

  public async getCollectionKeys(ticker: string): Promise<CollectionKeyModel[]> {
    const collection = await this.findCollection(ticker);

    const keys = await collection.collectionKeys();

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

  public async issueNft(ticker: string, params: IssueNftDto): ServiceReturn<Nft> {
    const { options, args } = extractTxOptions(params);

    const { issue } = await this.findCollection(ticker);

    return this.transactionsService.submit(issue, args, options);
  }

  public async redeemNft(ticker: string, id: BigNumber, params: RedeemNftDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const nft = await this.findNft(ticker, id);

    return this.transactionsService.submit(nft.redeem, { from: toPortfolioId(args.from) }, options);
  }
}
