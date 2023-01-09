import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NumberedPortfolio } from '@polymeshassociation/polymesh-sdk/types';

import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { DidDto } from '~/common/dto/params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { ModifyPortfolioDto } from '~/portfolios/dto/modify-portfolio.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { CreatedPortfolioModel } from '~/portfolios/models/created-portfolio.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
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
        portfolio: createPortfolioIdentifierModel(result),
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
}
