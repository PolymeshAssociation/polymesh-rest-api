import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ApiArrayResponse } from '~/common/decorators/swagger';
import { DidDto } from '~/common/dto/params.dto';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { DeletePortfolioParamsDto } from '~/portfolios/dto/delete-portfolio-params.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { PortfolioIdModel } from '~/portfolios/models/portfolio-id.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { createPortfolioIdentifierModel, createPortfolioModel } from '~/portfolios/portfolios.util';

import { IdParamsDto } from './../common/dto/id-params.dto';

@ApiTags('portfolios')
@Controller()
export class PortfoliosController {
  constructor(
    private readonly portfoliosService: PortfoliosService,
    private logger: PolymeshLogger
  ) {}

  @ApiOperation({
    summary: 'Get all Portfolios of an Identity',
    description: 'This endpoint will provide list of all the Portfolios of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose Portfolios are to be fetched',
    type: 'string',
    required: true,
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
  @ApiCreatedResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @Post('/identities/:did/portfolios/asset-movements')
  public async moveAssets(
    @Param() { did }: DidDto,
    @Body() transferParams: AssetMovementDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.portfoliosService.moveAssets(did, transferParams);
    return new TransactionQueueModel({ transactions });
  }

  @ApiOperation({
    summary: 'Create a Portfolio',
    description: 'This endpoint creates a Portfolio',
  })
  @ApiCreatedResponse({
    description: 'Details of the newly created Portfolio',
    type: PortfolioIdModel,
  })
  @Post('/portfolios')
  public async createPortfolio(
    @Body() createPortfolioParams: CreatePortfolioDto
  ): Promise<PortfolioIdModel> {
    const { result, transactions } = await this.portfoliosService.createPortfolio(
      createPortfolioParams
    );
    return new PortfolioIdModel({
      portfolioId: createPortfolioIdentifierModel(result),
      transactions,
    });
  }

  @ApiOperation({
    summary: 'Delete a Portfolio',
    description: 'This endpoint creates a Portfolio',
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio number to be deleted',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description:
      "The Portfolio doesn't exist, You cannot delete a Portfolio that contains any assets",
  })
  @ApiInternalServerErrorResponse({
    description: 'The Portfolio was removed and no longer exists',
  })
  @Delete('/:id')
  public async deletePortfolio(
    @Param() { id }: IdParamsDto,
    @Query() { did, signer }: DeletePortfolioParamsDto
  ): Promise<TransactionQueueModel> {
    const portfolio = new PortfolioDto({ id, did });
    const { transactions } = await this.portfoliosService.deletePortfolio(portfolio, signer);
    return new TransactionQueueModel({ transactions });
  }
}
