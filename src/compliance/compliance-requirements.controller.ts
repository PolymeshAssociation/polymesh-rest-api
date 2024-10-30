import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators/';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { RequirementDto } from '~/compliance/dto/requirement.dto';
import { RequirementParamsDto } from '~/compliance/dto/requirement-params.dto';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { ComplianceRequirementsModel } from '~/compliance/models/compliance-requirements.model';
import { ComplianceStatusModel } from '~/compliance/models/compliance-status.model';
import { RequirementModel } from '~/compliance/models/requirement.model';
import { TrustedClaimIssuerModel } from '~/compliance/models/trusted-claim-issuer.model';

@ApiTags('assets', 'compliance')
@Controller('assets/:asset/compliance-requirements')
export class ComplianceRequirementsController {
  constructor(private readonly complianceRequirementsService: ComplianceRequirementsService) {}

  @ApiOperation({
    summary: 'Fetch Compliance Requirements of an Asset',
    description:
      'This endpoint will provide the list of all compliance requirements of an Asset along with Default Trusted Claim Issuers',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Compliance Requirements are to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiOkResponse({
    description:
      'List of Compliance Requirements of the Asset along with Default Trusted Claim Issuers',
    type: ComplianceRequirementsModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset was not found',
  })
  @Get()
  public async getComplianceRequirements(
    @Param() { asset }: AssetParamsDto
  ): Promise<ComplianceRequirementsModel> {
    const { requirements, defaultTrustedClaimIssuers } =
      await this.complianceRequirementsService.findComplianceRequirements(asset);

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
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose compliance requirements are to be set',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset was not found',
  })
  @Post('set')
  public async setRequirements(
    @Param() { asset }: AssetParamsDto,
    @Body() params: SetRequirementsDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceRequirementsService.setRequirements(asset, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Pause compliance requirements for an Asset',
    description: 'This endpoint pauses compliance rules for an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose compliance requirements are to be paused',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Insufficient balance to perform transaction'],
  })
  @Post('pause')
  public async pauseRequirements(
    @Param() { asset }: AssetParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceRequirementsService.pauseRequirements(
      asset,
      transactionBaseDto
    );
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Unpause compliance requirements for an Asset',
    description: 'This endpoint unpauses compliance rules for an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose compliance requirements are to be unpaused',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found'],
  })
  @Post('unpause')
  public async unpauseRequirements(
    @Param() { asset }: AssetParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceRequirementsService.unpauseRequirements(
      asset,
      transactionBaseDto
    );
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Delete single compliance requirement for an Asset',
    description: 'This endpoint deletes referenced compliance requirement for an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) from whose compliance requirement is to be deleted',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the compliance requirement to be deleted',
    type: 'string',
    example: '123',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Insufficient balance to perform transaction'],
  })
  @Post(':id/delete')
  public async deleteRequirement(
    @Param() { id, asset }: RequirementParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceRequirementsService.deleteOne(
      asset,
      id,
      transactionBaseDto
    );

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Delete all compliance requirements for an Asset',
    description: 'This endpoint deletes all compliance requirements for an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose compliance requirements are to be deleted',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found'],
    [HttpStatus.BAD_REQUEST]: [
      'Returned if there are no existing compliance requirements for the Asset',
    ],
  })
  @Post('delete')
  public async deleteRequirements(
    @Param() { asset }: AssetParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceRequirementsService.deleteAll(asset, transactionBaseDto);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Add a new compliance requirement for an Asset',
    description:
      "This endpoint adds a new compliance requirement to the specified Asset. This doesn't modify the existing requirements",
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) to which the compliance requirement is to be added',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found'],
    [HttpStatus.BAD_REQUEST]: ['Returned if the transaction failed'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Compliance Requirement complexity limit exceeded'],
  })
  @Post('add')
  public async addRequirement(
    @Param() { asset }: AssetParamsDto,
    @Body() params: RequirementDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceRequirementsService.add(asset, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Modify single compliance requirement for an Asset',
    description: 'This endpoint modifies referenced compliance requirement for an Asset',
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Ticker/Asset ID) for which the compliance requirement is to be modified',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of the compliance requirement to be modified',
    type: 'string',
    example: '123',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset or compliance requirement was not found'],
    [HttpStatus.BAD_REQUEST]: ['Returned if there is no change in data'],
  })
  @Post(':id/modify')
  public async modifyComplianceRequirement(
    @Param() { id, asset }: RequirementParamsDto,
    @Body() params: RequirementDto
  ): Promise<TransactionResponseModel> {
    const result = await this.complianceRequirementsService.modify(asset, id, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Check if the requirements are paused',
    description: 'This endpoint checks if the compliance requirements are paused for a given asset',
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Ticker/Asset ID) whose compliance requirements status are to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiOkResponse({
    description: 'Compliance Requirement status',
    type: ComplianceStatusModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @Get('status')
  public async areRequirementsPaused(
    @Param() { asset }: AssetParamsDto
  ): Promise<ComplianceStatusModel> {
    const arePaused = await this.complianceRequirementsService.arePaused(asset);

    return new ComplianceStatusModel({ arePaused });
  }
}
