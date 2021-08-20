import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { CorporateActionDefaultsModel } from '~/corporate-actions/model/corporate-action-defaults.model';
import { CorporateActionTargetsModel } from '~/corporate-actions/model/corporate-action-targets.model';
import { TaxWithholdingModel } from '~/corporate-actions/model/tax-withholding.model';

import { CorporateActionsService } from './corporate-actions.service';

@ApiTags('corporate-actions')
@Controller('assets/:ticker/corporate-actions')
export class CorporateActionsController {
  constructor(private readonly corporateActionsService: CorporateActionsService) {}

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
}
