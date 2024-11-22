import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiGoneResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { NftCollection } from '@polymeshassociation/polymesh-sdk/types';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { CreatedNftCollectionModel } from '~/assets/models/created-nft-collection.model';
import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { CreateNftCollectionDto } from '~/nfts/dto/create-nft-collection.dto';
import { IssueNftDto } from '~/nfts/dto/issue-nft.dto';
import { NftParamsDto } from '~/nfts/dto/nft-params.dto';
import { RedeemNftDto } from '~/nfts/dto/redeem-nft.dto';
import { CollectionKeyModel } from '~/nfts/models/collection-key.model';
import { NftModel } from '~/nfts/models/nft.model';
import { NftsService } from '~/nfts/nfts.service';

@ApiTags('nfts')
@Controller('nfts')
export class NftsController {
  constructor(private readonly nftService: NftsService) {}

  @ApiOperation({
    summary: 'Fetch the required metadata keys for an NFT Collection',
    description: 'This endpoint will provide the NFT collection keys for an NFT Collection',
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Asset ID/Ticker) of the NFT Collection whose collection keys are to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiArrayResponse(CollectionKeyModel, {
    description: 'List of required metadata values for each NFT in the collection',
    paginated: true,
  })
  @Get(':asset/collection-keys')
  public async getCollectionKeys(
    @Param() { asset }: AssetParamsDto
  ): Promise<CollectionKeyModel[]> {
    return this.nftService.getCollectionKeys(asset);
  }

  @ApiOperation({
    summary: 'Fetch the details of an NFT',
    description: 'This endpoint will return the metadata details of an NFT',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Asset ID/Ticker) of the NFT Collection',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the NFT',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    type: NftModel,
    description: 'List of required metadata values for each NFT in the collection',
  })
  @Get(':asset/:id')
  public async getNftDetails(@Param() { asset, id }: NftParamsDto): Promise<NftModel> {
    return this.nftService.nftDetails(asset, id);
  }

  @ApiOperation({
    summary: 'Create an NFT collection',
    description: 'This endpoint allows for the creation of NFT collections',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction along with newly created nft collection',
    type: TransactionQueueModel,
  })
  @ApiGoneResponse({
    description: 'The ticker has already been used to create an asset',
  })
  @Post('/create')
  public async createNftCollection(
    @Body() params: CreateNftCollectionDto
  ): Promise<TransactionResponseModel> {
    const result = await this.nftService.createNftCollection(params);

    const resolver: TransactionResolver<NftCollection> = ({
      result: collection,
      transactions,
      details,
    }) =>
      new CreatedNftCollectionModel({
        collection,
        transactions,
        details,
      });

    return handleServiceResult(result, resolver);
  }

  @ApiOperation({
    summary: 'Issue an NFT for a collection',
    description: 'This endpoint allows for the issuance of NFTs',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Asset ID/Ticker) of the NFT Collection to issue an NFT for',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post(':asset/issue')
  public async issueNft(
    @Param() { asset }: AssetParamsDto,
    @Body() params: IssueNftDto
  ): Promise<TransactionResponseModel> {
    const result = await this.nftService.issueNft(asset, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Redeem an NFT, this removes it from circulation',
    description: 'This endpoint allows for the redemption (aka burning) of NFTs',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Asset ID/Ticker) of the NFT Collection to redeem an NFT from',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the NFT',
    type: 'string',
    example: '1',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post(':asset/:id/redeem')
  public async redeem(
    @Param() { asset, id }: NftParamsDto,
    @Body() params: RedeemNftDto
  ): Promise<TransactionResponseModel> {
    const result = await this.nftService.redeemNft(asset, id, params);

    return handleServiceResult(result);
  }
}
