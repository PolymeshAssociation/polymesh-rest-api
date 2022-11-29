import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { AssetsService } from '~/assets/assets.service';
import { createAssetDetailsModel } from '~/assets/assets.util';
import { ControllerTransferDto } from '~/assets/dto/controller-transfer.dto';
import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { IssueDto } from '~/assets/dto/issue.dto';
import { RedeemTokensDto } from '~/assets/dto/redeem-tokens.dto';
import { SetAssetDocumentsDto } from '~/assets/dto/set-asset-documents.dto';
import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { AgentOperationModel } from '~/assets/models/agent-operation.model';
import { AssetDetailsModel } from '~/assets/models/asset-details.model';
import { AssetDocumentModel } from '~/assets/models/asset-document.model';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { authorizationRequestResolver } from '~/authorizations/authorizations.util';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransferOwnershipDto } from '~/common/dto/transfer-ownership.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly complianceRequirementsService: ComplianceRequirementsService
  ) {}

  @ApiOperation({
    summary: 'Fetch Asset details',
    description: 'This endpoint will provide the basic details of an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose details are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Basic details of the Asset',
    type: AssetDetailsModel,
  })
  @Get(':ticker')
  public async getDetails(@Param() { ticker }: TickerParamsDto): Promise<AssetDetailsModel> {
    const asset = await this.assetsService.findOne(ticker);

    return createAssetDetailsModel(asset);
  }

  @ApiOperation({
    summary: 'Fetch a list of Asset holders',
    description:
      'This endpoint will provide the list of Asset holders along with their current balance',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose holders are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Asset holders to be fetched',
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which Asset holders are to be fetched',
    type: 'string',
    required: false,
  })
  @ApiArrayResponse(IdentityBalanceModel, {
    description: 'List of Asset holders, each consisting of a DID and their current Asset balance',
    paginated: true,
  })
  @Get(':ticker/holders')
  public async getHolders(
    @Param() { ticker }: TickerParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<IdentityBalanceModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.assetsService.findHolders(ticker, size, start?.toString());

    return new PaginatedResultsModel({
      results: data.map(
        ({ identity, balance }) =>
          new IdentityBalanceModel({
            identity: identity.did,
            balance,
          })
      ),
      total,
      next,
    });
  }

  @ApiOperation({
    summary: 'Fetch a list of Asset documents',
    description: 'This endpoint will provide the list of documents attached to an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose attached documents are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of documents to be fetched',
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which documents are to be fetched',
    type: 'string',
    required: false,
    example: 'START_KEY',
  })
  @ApiArrayResponse(AssetDocumentModel, {
    description: 'List of documents attached to the Asset',
    paginated: true,
  })
  @Get(':ticker/documents')
  public async getDocuments(
    @Param() { ticker }: TickerParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<AssetDocumentModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.assetsService.findDocuments(ticker, size, start?.toString());

    return new PaginatedResultsModel({
      results: data.map(
        ({ name, uri, contentHash, type, filedAt }) =>
          new AssetDocumentModel({
            name,
            uri,
            contentHash,
            type,
            filedAt,
          })
      ),
      total,
      next,
    });
  }

  @ApiOperation({
    summary: 'Set a list of Documents for an Asset',
    description:
      'This endpoint assigns a new list of Documents to the Asset by replacing the existing list of Documents with the ones passed in the body',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose documents are to be updated',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
  })
  @ApiNotFoundResponse({
    description: 'Asset was not found',
  })
  @ApiBadRequestResponse({
    description: 'The supplied Document list is equal to the current one',
  })
  @Post(':ticker/documents/set')
  public async setDocuments(
    @Param() { ticker }: TickerParamsDto,
    @Body() setAssetDocumentsDto: SetAssetDocumentsDto
  ): Promise<TransactionResponseModel> {
    const result = await this.assetsService.setDocuments(ticker, setAssetDocumentsDto);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Issue more of an Asset',
    description: 'This endpoint issues more of a given Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset to issue',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @Post(':ticker/issue')
  public async issue(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: IssueDto
  ): Promise<TransactionResponseModel> {
    const result = await this.assetsService.issue(ticker, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Create an Asset',
    description: 'This endpoint allows for the creation of new assets',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The ticker reservation does not exist',
  })
  @ApiGoneResponse({
    description: 'The ticker has already been used to create an asset',
  })
  @Post('create')
  public async createAsset(@Body() params: CreateAssetDto): Promise<TransactionResponseModel> {
    const result = await this.assetsService.createAsset(params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Transfer ownership of an Asset',
    description:
      'This endpoint transfers ownership of the Asset to a `target` Identity. This generates an authorization request that must be accepted by the `target` Identity',
  })
  @ApiParam({
    name: 'ticker',
    description: 'Ticker of the Asset whose ownership is to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedAuthorizationRequestModel,
  })
  @Post('/:ticker/transfer-ownership')
  public async transferOwnership(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: TransferOwnershipDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.assetsService.transferOwnership(ticker, params);

    return handleServiceResult(serviceResult, authorizationRequestResolver);
  }

  @ApiOperation({
    summary: 'Redeem Asset tokens',
    description:
      "This endpoint allows to redeem (burn) an amount of an Asset tokens. These tokens are removed from Signer's Default Portfolio",
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The amount to be redeemed is larger than the free balance in the Signer's Default Portfolio",
  })
  @Post(':ticker/redeem')
  public async redeem(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: RedeemTokensDto
  ): Promise<TransactionResponseModel> {
    const result = await this.assetsService.redeem(ticker, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Freeze transfers for an Asset',
    description:
      'This endpoint submits a transaction that causes the Asset to become frozen. This means that it cannot be transferred or minted until it is unfrozen',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset to freeze',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The Asset is already frozen',
  })
  @Post(':ticker/freeze')
  public async freeze(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.assetsService.freeze(ticker, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Unfreeze transfers for an Asset',
    description:
      'This endpoint submits a transaction that unfreezes the Asset. This means that transfers and minting can be performed until it is frozen again',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset to unfreeze',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The Asset is already unfrozen',
  })
  @Post(':ticker/unfreeze')
  public async unfreeze(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.assetsService.unfreeze(ticker, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Controller Transfer',
    description:
      'This endpoint forces a transfer from the `origin` Portfolio to the signer’s Default Portfolio',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The `origin` Portfolio does not have enough free balance for the transfer',
  })
  @Post(':ticker/controller-transfer')
  public async controllerTransfer(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: ControllerTransferDto
  ): Promise<TransactionResponseModel> {
    const result = await this.assetsService.controllerTransfer(ticker, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: "Fetch an Asset's operation history",
    description:
      "This endpoint provides a list of events triggered by transactions performed by various agent Identities, related to the Asset's configuration",
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose operation history is to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'List of operations grouped by the agent Identity who performed them',
    isArray: true,
    type: AgentOperationModel,
  })
  @Get(':ticker/operations')
  public async getOperationHistory(
    @Param() { ticker }: TickerParamsDto
  ): Promise<AgentOperationModel[]> {
    const agentOperations = await this.assetsService.getOperationHistory(ticker);

    return agentOperations.map(agentOperation => new AgentOperationModel(agentOperation));
  }
}
