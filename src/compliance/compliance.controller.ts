import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { RequirementModel } from '~/assets/models/requirement.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { ComplianceService } from '~/compliance/compliance.service';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';

@ApiTags('compliance')
@Controller('/assets/:ticker/compliance-requirements')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch compliance requirements for an Asset',
    description: 'This endpoint will provide the list of all compliance requirements of an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose compliance requirements are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(RequirementModel, {
    description: 'List of compliance requirements of the Asset',
    paginated: false,
  })
  @Get()
  public async getComplianceRequirements(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<RequirementModel>> {
    const result = await this.complianceService.findComplianceRequirements(ticker);

    return new ResultsModel({
      results: result.requirements.map(
        ({ id, conditions }) => new RequirementModel({ id, conditions })
      ),
    });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Set Compliance requirements for an Asset',
    description:
      'This endpoint sets Compliance rules for an Asset. This method will replace the current rules',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose compliance requirements are to be set',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Put()
  public async setRequirements(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: SetRequirementsDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.complianceService.setRequirements(ticker, params);
    return new TransactionQueueModel({ transactions });
  }
}
