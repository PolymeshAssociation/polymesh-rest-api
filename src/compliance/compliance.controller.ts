import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ComplianceService } from '~/compliance/compliance.service';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { ComplianceRequirementsModel } from '~/compliance/models/compliance-requirements.model';
import { RequirementModel } from '~/compliance/models/requirement.model';
import { TrustedClaimIssuerModel } from '~/compliance/models/trusted-claim-issuer.model';

@ApiTags('assets', 'compliance')
@Controller('assets/:ticker/compliance-requirements')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @ApiOperation({
    summary: 'Fetch Compliance Requirements of an Asset',
    description:
      'This endpoint will provide the list of all compliance requirements of an Asset along with Default Trusted Claim Issuers',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose Compliance Requirements are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description:
      'List of Compliance Requirements of the Asset along with Default Trusted Claim Issuers',
    type: ComplianceRequirementsModel,
  })
  @Get()
  public async getComplianceRequirements(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ComplianceRequirementsModel> {
    const { requirements, defaultTrustedClaimIssuers } =
      await this.complianceService.findComplianceRequirements(ticker);

    return new ComplianceRequirementsModel({
      requirements: requirements.map(
        ({ id, conditions }) => new RequirementModel({ id, conditions })
      ),
      defaultTrustedClaimIssuers: defaultTrustedClaimIssuers.map(
        ({ identity: { did }, trustedFor }) => new TrustedClaimIssuerModel({ did, trustedFor })
      ),
    });
  }

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
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('set')
  public async setRequirements(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: SetRequirementsDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceService.setRequirements(ticker, params);
    return handleServiceResult(result);
  }
}
