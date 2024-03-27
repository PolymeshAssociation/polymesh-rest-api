import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NumberedPortfolio } from '@polymeshassociation/polymesh-sdk/types';

import {
  ApiArrayResponse,
  ApiTransactionFailedResponse,
  ApiTransactionResponse,
} from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { DidDto } from '~/common/dto/params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { GetTransactionsDto } from '~/portfolios/dto/get-transactions.dto';
import { ModifyPortfolioDto } from '~/portfolios/dto/modify-portfolio.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { SetCustodianDto } from '~/portfolios/dto/set-custodian.dto';
import { CreatedPortfolioModel } from '~/portfolios/models/created-portfolio.model';
import { HistoricSettlementModel } from '~/portfolios/models/historic-settlement.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { createPortfolioIdentifierModel, createPortfolioModel } from '~/portfolios/portfolios.util';

@ApiTags('portfolios')
@Controller()
export class PortfoliosController {
  constructor(
    private readonly portfoliosService: PortfoliosService,
    private logger: PolymeshLogger
  ) {
    logger.setContext(PortfoliosService.name);
  }

  @ApiOperation({
    summary: 'Get all Portfolios of an Identity',
    description: 'This endpoint will provide list of all the Portfolios of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose Portfolios are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse(PortfolioModel, {
    description: 'Return the list of all Portfolios of the given Identity',
    paginated: false,
  })
  @Get('/identities/:did/portfolios')
  async getPortfolios(@Param() { did }: DidDto): Promise<ResultsModel<PortfolioModel>> {
    this.logger.debug(`Fetching portfolios for ${did}`);

    const portfolios = await this.portfoliosService.findAllByOwner(did);

    const results = await Promise.all(
      portfolios.map(portfolio => createPortfolioModel(portfolio, did))
    );

    this.logger.debug(`Returning details of ${portfolios.length} portfolios for did ${did}`);

    return new ResultsModel({ results });
  }

  @ApiOperation({
    summary: 'Move Assets between portfolios',
    description: 'This endpoint moves Assets between Portfolios',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the owner of the Portfolios to move assets between.',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiTransactionResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @Post('/identities/:did/portfolios/move-assets')
  public async moveAssets(
    @Param() { did }: DidDto,
    @Body() transferParams: AssetMovementDto
  ): Promise<TransactionResponseModel> {
    const result = await this.portfoliosService.moveAssets(did, transferParams);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Create a Portfolio',
    description: 'This endpoint creates a Portfolio',
  })
  @ApiTransactionResponse({
    description: 'Details of the newly created Portfolio',
    type: CreatedPortfolioModel,
  })
  @Post('/portfolios/create')
  public async createPortfolio(
    @Body() createPortfolioParams: CreatePortfolioDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.portfoliosService.createPortfolio(createPortfolioParams);
    const resolver: TransactionResolver<NumberedPortfolio> = ({ transactions, details, result }) =>
      new CreatedPortfolioModel({
        portfolio: createPortfolioIdentifierModel(result as NumberedPortfolio),
        details,
        transactions,
      });
    return handleServiceResult(serviceResult, resolver);
  }

  // TODO @prashantasdeveloper: Update error responses post handling error codes
  // TODO @prashantasdeveloper: Move the signer to headers
  @ApiOperation({
    summary: 'Delete a Portfolio',
    description: 'This endpoint deletes a Portfolio',
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio number to be deleted',
    type: 'string',
    example: '1',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Portfolio owner',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description: "Either the Portfolio doesn't exist or contains assets",
  })
  @ApiNotFoundResponse({
    description: 'The Portfolio was removed and no longer exists',
  })
  @Post('/identities/:did/portfolios/:id/delete')
  public async deletePortfolio(
    @Param() portfolio: PortfolioDto,
    @Query() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.portfoliosService.deletePortfolio(portfolio, transactionBaseDto);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Modify Portfolio name',
    description: 'This endpoint modifies Portfolio name for a numbered portfolio',
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio number for which name is to be modified',
    type: 'string',
    example: '1',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Portfolio owner',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiTransactionResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Portfolio was not found'],
  })
  @Post('/identities/:did/portfolios/:id/modify-name')
  public async modifyPortfolioName(
    @Param() portfolioParams: PortfolioDto,
    @Body() modifyPortfolioParams: ModifyPortfolioDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.portfoliosService.updatePortfolioName(
      portfolioParams,
      modifyPortfolioParams
    );

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Get all custodied Portfolios of an Identity',
    description: 'This endpoint will provide list of all the custodied Portfolios of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose custodied Portfolios are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse(PortfolioIdentifierModel, {
    description: 'Returns the list of all custodied Portfolios of the given Identity',
    paginated: true,
  })
  @Get('/identities/:did/custodied-portfolios')
  async getCustodiedPortfolios(
    @Param() { did }: DidDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<PortfolioIdentifierModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.portfoliosService.getCustodiedPortfolios(did, {
      size,
      start: start?.toString(),
    });

    const results = data.map(portfolio => createPortfolioIdentifierModel(portfolio));

    return new PaginatedResultsModel({
      results,
      total,
      next,
    });
  }

  @ApiOperation({
    summary: 'Get details of a Portfolio for an Identity',
    description: 'This endpoint will provide details for the provided Portfolio of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose Portfolio details are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiParam({
    name: 'id',
    description:
      'The ID of the portfolio for which details are to be fetched. Use 0 for default Portfolio',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Portfolio details',
    type: PortfolioModel,
  })
  @Get('/identities/:did/portfolios/:id')
  async getPortfolio(@Param() { did, id }: PortfolioDto): Promise<PortfolioModel> {
    const portfolio = await this.portfoliosService.findOne(did, id);

    return createPortfolioModel(portfolio, did);
  }

  @ApiOperation({
    summary: 'Set Portfolio Custodian',
    description: 'This endpoint will set Custodian for the provided Portfolio of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity who owns the Portfolio for which Custodian is to be set',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiParam({
    name: 'id',
    description:
      'The ID of the portfolio for which to set the Custodian. Use 0 for default Portfolio',
    type: 'string',
    example: '1',
  })
  @ApiTransactionResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: [
      'The Portfolio with provided ID was not found',
      'The Identity with provided DID was not found',
    ],
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Insufficient balance to set Custodian for the Portfolio'],
  })
  @Post('/identities/:did/portfolios/:id/custodian')
  async setCustodian(
    @Param() { did, id }: PortfolioDto,
    @Body() setCustodianParams: SetCustodianDto
  ): Promise<TransactionResponseModel> {
    const result = await this.portfoliosService.setCustodian(did, id, setCustodianParams);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get list of transactions for a Portfolio',
    description:
      'This endpoint will provide list of transaction for the provided Portfolio of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose Portfolio transactions are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiParam({
    name: 'id',
    description:
      'The ID of the portfolio for which transactions are to be fetched. Use 0 for the default Portfolio',
    type: 'string',
    example: '0',
  })
  @ApiOkResponse({
    description: 'Portfolio transactions',
    type: HistoricSettlementModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: [
      'The Portfolio with provided ID was not found',
      'The Identity with provided DID was not found',
    ],
  })
  @Get('/identities/:did/portfolios/:id/transactions')
  async getTransactionHistory(
    @Param() { did, id }: PortfolioDto,
    @Query() { account, ticker }: GetTransactionsDto
  ): Promise<ResultsModel<HistoricSettlementModel>> {
    const data = await this.portfoliosService.getTransactions(did, id, account, ticker);

    const results = data.map(settlement => new HistoricSettlementModel(settlement));

    return new ResultsModel({ results });
  }

  @ApiOperation({
    summary: 'Quit Custody of a Portfolio',
    description:
      'This endpoint will quit signers Custody over the provided Portfolio of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity who owns the Portfolio for which Custody is to be quit',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiParam({
    name: 'id',
    description:
      'The ID of the portfolio for which to quit Custody. Use 0 for the default Portfolio',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiTransactionResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: [
      'The Portfolio with provided ID was not found',
      'The Identity with provided DID was not found',
    ],
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Insufficient balance to quit Custody for the Portfolio'],
  })
  @Post('/identities/:did/portfolios/:id/quit-custody')
  async quitCustody(
    @Param() { did, id }: PortfolioDto,
    @Body() txBase: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.portfoliosService.quitCustody(did, id, txBase);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get Portfolio creation event data',
    description:
      'The endpoint retrieves the identifier data (block number, date and event index) of the event that was emitted when the given Numbered Portfolio was created. This requires Polymesh GraphQL Middleware Service',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose Portfolio creation event is to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiParam({
    name: 'id',
    description:
      'The ID of the portfolio for which Portfolio creation event is to be fetched. Throws an error if default Portfolio (0) details are requested',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Details of event where the Numbered Portfolio was created',
    type: EventIdentifierModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: [
      "The Portfolio doesn't exist",
      "The Portfolio hasn't yet been processed by the Middleware",
    ],
    [HttpStatus.BAD_REQUEST]: ['Event details for default Portfolio are requested'],
  })
  @Get('/identities/:did/portfolios/:id/created-at')
  async createdAt(@Param() { did, id }: PortfolioDto): Promise<EventIdentifierModel> {
    const result = await this.portfoliosService.createdAt(did, id);

    if (!result) {
      throw new NotFoundException("Portfolio data hasn't yet been processed by the middleware");
    }

    return new EventIdentifierModel(result);
  }
}
