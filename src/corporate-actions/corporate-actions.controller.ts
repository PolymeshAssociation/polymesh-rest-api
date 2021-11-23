import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import {
  createDividendDistributionDetailsModel,
  createDividendDistributionModel,
} from '~/corporate-actions/corporate-actions.util';
import { CorporateActionDefaultsDto } from '~/corporate-actions/dto/corporate-action-defaults.dto';
import { CorporateActionDefaultsModel } from '~/corporate-actions/model/corporate-action-defaults.model';
import { CorporateActionTargetsModel } from '~/corporate-actions/model/corporate-action-targets.model';
import { CreatedDividendDistributionModel } from '~/corporate-actions/model/created-dividend-distribution.model';
import { DividendDistributionDetailsModel } from '~/corporate-actions/model/dividend-distribution-details.model';
import { TaxWithholdingModel } from '~/corporate-actions/model/tax-withholding.model';

import { DividendDistributionDto } from './dto/dividend-distribution.dto';

@ApiTags('corporate-actions')
@Controller('assets/:ticker/corporate-actions')
export class CorporateActionsController {
  constructor(private readonly corporateActionsService: CorporateActionsService) {}

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch Corporate Action defaults',
    description:
      "This endpoint will provide the default target Identities, global tax withholding percentage, and per-Identity tax withholding percentages for the Asset's Corporate Actions. Any Corporate Action that is created will use these values unless they are explicitly overridden",
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose Corporate Action defaults are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Corporate Action defaults for the specified Asset',
    type: CorporateActionDefaultsModel,
  })
  @Get('defaults')
  public async getDefaults(
    @Param() { ticker }: TickerParamsDto
  ): Promise<CorporateActionDefaultsModel> {
    const {
      targets,
      defaultTaxWithholding,
      taxWithholdings,
    } = await this.corporateActionsService.findDefaultsByTicker(ticker);
    return new CorporateActionDefaultsModel({
      targets: new CorporateActionTargetsModel(targets),
      defaultTaxWithholding,
      taxWithholdings: taxWithholdings.map(
        taxWithholding => new TaxWithholdingModel(taxWithholding)
      ),
    });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Update Corporate Action defaults',
    description:
      "This endpoint updates the default target Identities, global tax withholding percentage, and per-Identity tax withholding percentages for the Asset's Corporate Actions. Any Corporate Action that is created will use these values unless they are explicitly overridden",
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose Corporate Action defaults are to be updated',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Patch('defaults')
  public async updateDefaults(
    @Param() { ticker }: TickerParamsDto,
    @Body() corporateActionDefaultsDto: CorporateActionDefaultsDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.corporateActionsService.updateDefaultsByTicker(
      ticker,
      corporateActionDefaultsDto
    );
    return new TransactionQueueModel({ transactions });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch Dividend Distributions',
    description:
      'This endpoint will provide the list of Dividend Distributions associated with an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose Dividend Distributions are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(DividendDistributionDetailsModel, {
    description: 'List of Dividend Distributions associated with the specified Asset',
    paginated: false,
  })
  @Get('dividend-distributions')
  public async getDividendDistributions(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<DividendDistributionDetailsModel>> {
    const results = await this.corporateActionsService.findDistributionsByTicker(ticker);
    return new ResultsModel({
      results: results.map(distributionWithDetails =>
        createDividendDistributionDetailsModel(distributionWithDetails)
      ),
    });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Configure Dividend Distributions',
    description:
      'This endpoint will create a Dividend Distribution for a subset of the Asset holders at a certain (existing or future) Checkpoint.',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which a Dividend Distribution is to be created',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details of the newly created Dividend Distribution',
    type: CreatedDividendDistributionModel,
  })
  @ApiBadRequestResponse({
    description: 'Origin Portfolio free balance is not enough to cover the distribution amount',
  })
  @Post('dividend-distributions')
  public async createDividendDistribution(
    @Param() { ticker }: TickerParamsDto,
    @Body() dividendDistributionDto: DividendDistributionDto
  ): Promise<CreatedDividendDistributionModel> {
    const {
      result,
      transactions,
    } = await this.corporateActionsService.createDividendDistributionByTicker(
      ticker,
      dividendDistributionDto
    );
    return new CreatedDividendDistributionModel({
      dividendDistribution: createDividendDistributionModel(result),
      transactions,
    });
  }
}
