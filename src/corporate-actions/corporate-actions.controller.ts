import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { DividendDistribution } from '@polymeshassociation/polymesh-sdk/types';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/';
import { IsAsset } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import {
  createDividendDistributionDetailsModel,
  createDividendDistributionModel,
} from '~/corporate-actions/corporate-actions.util';
import { CorporateActionDefaultConfigDto } from '~/corporate-actions/dto/corporate-action-default-config.dto';
import { DividendDistributionDto } from '~/corporate-actions/dto/dividend-distribution.dto';
import { LinkDocumentsDto } from '~/corporate-actions/dto/link-documents.dto';
import { ModifyDistributionCheckpointDto } from '~/corporate-actions/dto/modify-distribution-checkpoint.dto';
import { PayDividendsDto } from '~/corporate-actions/dto/pay-dividends.dto';
import { CorporateActionDefaultConfigModel } from '~/corporate-actions/models/corporate-action-default-config.model';
import { CorporateActionTargetsModel } from '~/corporate-actions/models/corporate-action-targets.model';
import { CreatedDividendDistributionModel } from '~/corporate-actions/models/created-dividend-distribution.model';
import { DistributionPaymentModel } from '~/corporate-actions/models/distribution-payment.model';
import { DividendDistributionModel } from '~/corporate-actions/models/dividend-distribution.model';
import { DividendDistributionDetailsModel } from '~/corporate-actions/models/dividend-distribution-details.model';
import { TaxWithholdingModel } from '~/corporate-actions/models/tax-withholding.model';

class DividendDistributionParamsDto extends IdParamsDto {
  @IsAsset()
  readonly asset: string;
}

class DeleteCorporateActionParamsDto extends IdParamsDto {
  @IsAsset()
  readonly asset: string;
}

class DistributeFundsParamsDto extends IdParamsDto {
  @IsAsset()
  readonly asset: string;
}

@ApiTags('corporate-actions', 'assets')
@Controller('assets/:asset/corporate-actions')
export class CorporateActionsController {
  constructor(private readonly corporateActionsService: CorporateActionsService) {}

  @ApiOperation({
    summary: 'Fetch Corporate Action Default Config',
    description:
      "This endpoint will provide the default target Identities, global tax withholding percentage, and per-Identity tax withholding percentages for the Asset's Corporate Actions. Any Corporate Action that is created will use these values unless they are explicitly overridden",
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Ticker/Asset ID) whose Corporate Action Default Config is to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiOkResponse({
    description: 'Corporate Action Default Config for the specified Asset',
    type: CorporateActionDefaultConfigModel,
  })
  @Get('default-config')
  public async getDefaultConfig(
    @Param() { asset }: AssetParamsDto
  ): Promise<CorporateActionDefaultConfigModel> {
    const { targets, defaultTaxWithholding, taxWithholdings } =
      await this.corporateActionsService.findDefaultConfigByAsset(asset);
    return new CorporateActionDefaultConfigModel({
      targets: new CorporateActionTargetsModel(targets),
      defaultTaxWithholding,
      taxWithholdings: taxWithholdings.map(
        taxWithholding => new TaxWithholdingModel(taxWithholding)
      ),
    });
  }

  @ApiOperation({
    summary: 'Update Corporate Action Default Config',
    description:
      "This endpoint updates the default target Identities, global tax withholding percentage, and per-Identity tax withholding percentages for the Asset's Corporate Actions. Any Corporate Action that is created will use these values unless they are explicitly overridden",
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Ticker/Asset ID) whose Corporate Action Default Config is to be updated',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiOkResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post('default-config/modify')
  public async updateDefaultConfig(
    @Param() { asset }: AssetParamsDto,
    @Body() corporateActionDefaultConfigDto: CorporateActionDefaultConfigDto
  ): Promise<TransactionResponseModel> {
    const result = await this.corporateActionsService.updateDefaultConfigByAsset(
      asset,
      corporateActionDefaultConfigDto
    );
    return handleServiceResult(result);
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Fetch Dividend Distributions',
    description:
      'This endpoint will provide the list of Dividend Distributions associated with an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Dividend Distributions are to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiArrayResponse(DividendDistributionDetailsModel, {
    description: 'List of Dividend Distributions associated with the specified Asset',
    paginated: false,
  })
  @Get('dividend-distributions')
  public async getDividendDistributions(
    @Param() { asset }: AssetParamsDto
  ): Promise<ResultsModel<DividendDistributionDetailsModel>> {
    const results = await this.corporateActionsService.findDistributionsByAsset(asset);
    return new ResultsModel({
      results: results.map(distributionWithDetails =>
        createDividendDistributionDetailsModel(distributionWithDetails)
      ),
    });
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Fetch a Dividend Distribution',
    description:
      'This endpoint will provide a specific Dividend Distribution associated with an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Dividend Distribution is to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Dividend Distribution',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'The details of the Dividend Distribution',
    type: DividendDistributionModel,
  })
  @Get('dividend-distributions/:id')
  public async getDividendDistribution(
    @Param() { asset, id }: DividendDistributionParamsDto
  ): Promise<DividendDistributionDetailsModel> {
    const result = await this.corporateActionsService.findDistribution(asset, id);
    return createDividendDistributionDetailsModel(result);
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Create a Dividend Distribution',
    description:
      'This endpoint will create a Dividend Distribution for a subset of the Asset holders at a certain (existing or future) Checkpoint',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which a Dividend Distribution is to be created',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the newly created Dividend Distribution',
    type: CreatedDividendDistributionModel,
  })
  @ApiBadRequestResponse({
    description:
      '<ul>' +
      '<li>Payment date must be in the future</li>' +
      '<li>Expiry date must be after payment date</li>' +
      '<li>Declaration date must be in the past</li>' +
      '<li>Payment date must be after the Checkpoint date when passing a Date instead of an existing Checkpoint</li>' +
      '<li>Expiry date must be after the Checkpoint date when passing a Date instead of an existing Checkpoint</li>' +
      '<li>Checkpoint date must be in the future when passing a Date instead of an existing Checkpoint</li>' +
      '</ul>',
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' +
      "<li>The origin Portfolio's free balance is not enough to cover the Distribution amount</li>" +
      '<li>The Distribution has already expired</li>' +
      '</ul>',
  })
  @ApiNotFoundResponse({
    description:
      '<ul>' +
      "<li>Checkpoint doesn't exist</li>" +
      "<li>Checkpoint Schedule doesn't exist</li>" +
      '<li>Cannot distribute Dividends using the Asset as currency</li>' +
      '</ul>',
  })
  @Post('dividend-distributions/create')
  public async createDividendDistribution(
    @Param() { asset }: AssetParamsDto,
    @Body() dividendDistributionDto: DividendDistributionDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.corporateActionsService.createDividendDistribution(
      asset,
      dividendDistributionDto
    );

    const resolver: TransactionResolver<DividendDistribution> = ({
      transactions,
      result,
      details,
    }) =>
      new CreatedDividendDistributionModel({
        dividendDistribution: createDividendDistributionModel(result),
        transactions,
        details,
      });

    return handleServiceResult(serviceResult, resolver);
  }

  // TODO @prashantasdeveloper: Move the signer to headers
  @ApiOperation({
    summary: 'Delete a Corporate Action',
    description: 'This endpoint deletes a Corporate Action of a specific Asset',
  })
  @ApiParam({
    name: 'id',
    description: 'Corporate Action number to be deleted',
    type: 'string',
    example: '1',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Corporate Action is to be deleted',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiOkResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description: "The Corporate Action doesn't exist",
  })
  @Post(':id/delete')
  public async deleteCorporateAction(
    @Param() { id, asset }: DeleteCorporateActionParamsDto,
    @Query() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.corporateActionsService.remove(asset, id, transactionBaseDto);
    return handleServiceResult(result);
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Pay dividends for a Dividend Distribution',
    description: 'This endpoint transfers unclaimed dividends to a list of target Identities',
  })
  @ApiParam({
    name: 'id',
    description:
      'The Corporate Action number for the the Dividend Distribution (Dividend Distribution ID)',
    type: 'string',
    example: '1',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which dividends are to be transferred',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiOkResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description:
      '<ul>' +
      "<li>The Distribution's payment date hasn't been reached</li>" +
      '<li>The Distribution has already expired</li>' +
      '<li>Some of the supplied Identities have already either been paid or claimed their share of the Distribution</li>' +
      '<li>Some of the supplied Identities are not included in this Distribution</li>' +
      '</ul>',
  })
  @Post('dividend-distributions/:id/payments/pay')
  public async payDividends(
    @Param() { id, asset }: DistributeFundsParamsDto,
    @Body() payDividendsDto: PayDividendsDto
  ): Promise<TransactionResponseModel> {
    const result = await this.corporateActionsService.payDividends(asset, id, payDividendsDto);
    return handleServiceResult(result);
  }

  // TODO @prashantasdeveloper: Update error responses post handling error codes
  @ApiOperation({
    summary: 'Link documents to a Corporate Action',
    description:
      'This endpoint links a list of documents to the Corporate Action. Any previous links are removed in favor of the new list. All the documents to be linked should already be linked to the Asset of the Corporate Action.',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) to which the documents are attached',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Corporate Action',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Some of the provided documents are not associated with the Asset',
  })
  @Post(':id/documents/link')
  public async linkDocuments(
    @Param() { asset, id }: DividendDistributionParamsDto,
    @Body() linkDocumentsDto: LinkDocumentsDto
  ): Promise<TransactionResponseModel> {
    const result = await this.corporateActionsService.linkDocuments(asset, id, linkDocumentsDto);
    return handleServiceResult(result);
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Claim dividend payment for a Dividend Distribution',
    description:
      'This endpoint allows a target Identity of a Dividend distribution to claim their unclaimed Dividends',
  })
  @ApiParam({
    name: 'id',
    description:
      'The Corporate Action number for the the Dividend Distribution (Dividend Distribution ID)',
    type: 'string',
    example: '1',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which dividends are to be claimed',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiOkResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' +
      "<li>The Distribution's payment date hasn't been reached</li>" +
      '<li>The Distribution has already expired</li>' +
      '<li>The current Identity is not included in this Distribution</li>' +
      '<li>The current Identity has already claimed dividends</li>' +
      '</ul>',
  })
  @Post(':id/payments/claim')
  public async claimDividends(
    @Param() { id, asset }: DividendDistributionParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.corporateActionsService.claimDividends(asset, id, transactionBaseDto);
    return handleServiceResult(result);
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Reclaim remaining funds of a Dividend Distribution',
    description:
      'This endpoint reclaims any remaining funds back to the origin Portfolio from which the initial dividend funds came from. This can only be done after the Distribution has expired',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which dividends are to be reclaimed',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description:
      'The Corporate Action number for the expired Dividend Distribution (Dividend Distribution ID)',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' +
      '<li>The Distribution must be expired</li>' +
      '<li>Distribution funds have already been reclaimed</li>' +
      '</ul>',
  })
  @Post(':id/reclaim-funds')
  public async reclaimRemainingFunds(
    @Param() { id, asset }: DividendDistributionParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.corporateActionsService.reclaimRemainingFunds(
      asset,
      id,
      transactionBaseDto
    );
    return handleServiceResult(result);
  }

  @ApiTags('dividend-distributions', 'checkpoints')
  @ApiOperation({
    summary: 'Modify the Checkpoint of a Dividend Distribution',
    description:
      'This endpoint modifies the Checkpoint of a Dividend Distribution. The Checkpoint can be modified only if the payment period for the Distribution has not yet started',
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Ticker/Asset ID) whose Dividend Distribution Checkpoint is to be modified',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description:
      'The Corporate Action number for the the Dividend Distribution (Dividend Distribution ID)',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description:
      'The Checkpoint date must be in the future when passing a Date instead of an existing Checkpoint',
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' +
      '<li>Distribution is already in its payment period</li>' +
      '<li>Payment date must be after the Checkpoint date when passing a Date instead of an existing Checkpoint</li>' +
      '<li>Expiry date must be after the Checkpoint date when passing a Date instead of an existing Checkpoint</li>' +
      '</ul>',
  })
  @ApiNotFoundResponse({
    description:
      '<ul>' +
      "<li>Checkpoint doesn't exist</li>" +
      "<li>Checkpoint Schedule doesn't exist</li>" +
      '</ul>',
  })
  @Post('dividend-distributions/:id/modify-checkpoint')
  public async modifyDistributionCheckpoint(
    @Param() { id, asset }: DividendDistributionParamsDto,
    @Body() modifyDistributionCheckpointDto: ModifyDistributionCheckpointDto
  ): Promise<TransactionResponseModel> {
    const result = await this.corporateActionsService.modifyCheckpoint(
      asset,
      id,
      modifyDistributionCheckpointDto
    );
    return handleServiceResult(result);
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Get Payment History of a Dividend Distribution',
    description: 'This endpoint retrieves the Payment History of a Dividend Distribution',
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Ticker/Asset ID) whose Dividend Distribution Payment History is to be retrieved',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description:
      'The Corporate Action number for the the Dividend Distribution (Dividend Distribution ID)',
    type: 'string',
    example: '123',
  })
  @ApiNotFoundResponse({
    description:
      '<ul>' + '<li>Asset does not exist</li>' + '<li>Distribution does not exist</li>' + '</ul>',
  })
  @ApiArrayResponse(DistributionPaymentModel, {
    description: 'List of payments made for the Distribution',
    paginated: true,
  })
  @Get('dividend-distributions/:id/payment-history')
  public async getPaymentHistory(
    @Param() { id, asset }: DividendDistributionParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<DistributionPaymentModel>> {
    const result = await this.corporateActionsService.getPaymentHistory(
      asset,
      id,
      size,
      new BigNumber(start || 0)
    );

    return new PaginatedResultsModel({
      results: result.data.map(
        ({ target: { did }, ...rest }) => new DistributionPaymentModel({ did, ...rest })
      ),
      next: result.next,
    });
  }
}
