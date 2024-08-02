import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiGoneResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
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
    name: 'ticker',
    description: 'The ticker of the NFT Collection whose collection keys are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(CollectionKeyModel, {
    description: 'List of required metadata values for each NFT in the collection',
    paginated: true,
  })
  @Get(':ticker/collection-keys')
  public async getCollectionKeys(
    @Param() { ticker }: TickerParamsDto
  ): Promise<CollectionKeyModel[]> {
    return this.nftService.getCollectionKeys(ticker);
  }

  @ApiOperation({
    summary: 'Fetch the details of an NFT',
    description: 'This endpoint will return the metadata details of an NFT',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the NFT Collection',
    type: 'string',
    example: 'TICKER',
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
  @Get(':ticker/:id')
  public async getNftDetails(@Param() { ticker, id }: NftParamsDto): Promise<NftModel> {
    return this.nftService.nftDetails(ticker, id);
  }

  @ApiOperation({
    summary: 'Create an NFT collection',
    description: 'This endpoint allows for the creation of NFT collections',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
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

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Issue an NFT for a collection',
    description: 'This endpoint allows for the issuance of NFTs',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the NFT Collection to issue an NFT for',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post(':ticker/issue')
  public async issueNft(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: IssueNftDto
  ): Promise<TransactionResponseModel> {
    const result = await this.nftService.issueNft(ticker, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Redeem an NFT, this removes it from circulation',
    description: 'This endpoint allows for the redemption (aka burning) of NFTs',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the NFT Collection to redeem an NFT from',
    type: 'string',
    example: 'TICKER',
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
  @Post(':ticker/:id/redeem')
  public async redeem(
    @Param() { ticker, id }: NftParamsDto,
    @Body() params: RedeemNftDto
  ): Promise<TransactionResponseModel> {
    const result = await this.nftService.redeemNft(ticker, id, params);

    return handleServiceResult(result);
  }
}
