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

import { ApiArrayResponse, ApiCreatedOrSubscriptionResponse } from '~/common/decorators/swagger';
import { DidDto } from '~/common/dto/params.dto';
import { TransactionBaseDto } from '~/common/dto/signer.dto';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { ApiTransactionResponse, handlePayload, ModelResolver } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { CreatedPortfolioModel } from '~/portfolios/models/created-portfolio.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { createPortfolioIdentifierModel, createPortfolioModel } from '~/portfolios/portfolios.util';
import { basicModelResolver } from '~/transactions/transactions.util';

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
  @ApiCreatedOrSubscriptionResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @Post('/identities/:did/portfolios/move-assets')
  public async moveAssets(
    @Param() { did }: DidDto,
    @Body() transferParams: AssetMovementDto
  ): Promise<ApiTransactionResponse> {
    const result = await this.portfoliosService.moveAssets(did, transferParams);
    return handlePayload(result, basicModelResolver);
  }

  @ApiOperation({
    summary: 'Create a Portfolio',
    description: 'This endpoint creates a Portfolio',
  })
  @ApiCreatedOrSubscriptionResponse({
    description: 'Details of the newly created Portfolio',
    type: CreatedPortfolioModel,
  })
  @Post('/portfolios/create')
  public async createPortfolio(
    @Body() createPortfolioParams: CreatePortfolioDto
  ): Promise<ApiTransactionResponse> {
    const serviceResult = await this.portfoliosService.createPortfolio(createPortfolioParams);
    const resolver: ModelResolver<NumberedPortfolio> = ({ transactions, result }) =>
      Promise.resolve(
        new CreatedPortfolioModel({
          portfolio: createPortfolioIdentifierModel(result),
          transactions,
        })
      );
    return handlePayload(serviceResult, resolver);
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
    @Query() { signer, webhookUrl }: TransactionBaseDto
  ): Promise<ApiTransactionResponse> {
    const result = await this.portfoliosService.deletePortfolio(portfolio, signer, webhookUrl);
    return handlePayload(result, basicModelResolver);
  }
}
