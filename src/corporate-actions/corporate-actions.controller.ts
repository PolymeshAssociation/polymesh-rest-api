import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ResultsModel } from '~/common/models/results.model';
import { CorporateActionDefaultsModel } from '~/corporate-actions/model/corporate-action-defaults.model';
import { CorporateActionTargetsModel } from '~/corporate-actions/model/corporate-action-targets.model';
import { TaxWithholdingModel } from '~/corporate-actions/model/tax-withholding.model';

import { CorporateActionsService } from './corporate-actions.service';
import { DistributionWithDetailsModel } from './model/dividend-distribution-details.model';

@ApiTags('corporate-actions')
@Controller('assets/:ticker/corporate-actions')
export class CorporateActionsController {
  constructor(private readonly corporateActionsService: CorporateActionsService) {}

  @ApiOperation({
    summary: 'Fetch Corporate Action defaults',
    description:
      'This endpoint will provide the default values applied for each Corporate Action for an Asset',
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
  @ApiOkResponse({
    description: 'List of Dividend Distributions associated with the specified Asset',
    type: CorporateActionDefaultsModel,
  })
  @Get('dividend-distributions')
  public async getDividendDistributions(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<DistributionWithDetailsModel>> {
    const results = await this.corporateActionsService.findDistributionsByTicker(ticker);
    return new ResultsModel({
      results: results.map(
        ({ distribution, details }) =>
          new DistributionWithDetailsModel({ distribution, ...details })
      ),
    });
  }
}
