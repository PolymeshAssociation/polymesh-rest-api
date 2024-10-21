import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import {
  ApiArrayResponse,
  ApiTransactionFailedResponse,
  ApiTransactionResponse,
} from '~/common/decorators/';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { RemoveTrustedClaimIssuersDto } from '~/compliance/dto/remove-trusted-claim-issuers.dto';
import { SetTrustedClaimIssuersDto } from '~/compliance/dto/set-trusted-claim-issuers.dto';
import { TrustedClaimIssuerModel } from '~/compliance/models/trusted-claim-issuer.model';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';

@ApiTags('assets', 'compliance')
@Controller('assets/:asset/trusted-claim-issuers')
export class TrustedClaimIssuersController {
  constructor(private readonly trustedClaimIssuersService: TrustedClaimIssuersService) {}

  @ApiOperation({
    summary: 'Fetch trusted Claim Issuers of an Asset',
    description:
      'This endpoint will provide the list of all default trusted Claim Issuers of an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose trusted Claim Issuers are to be fetched',
    type: 'string',
    example: '0xa3616b82e8e1080aedc952ea28b9db8b',
  })
  @ApiArrayResponse(TrustedClaimIssuerModel, {
    description: 'List of trusted Claim Issuers of the Asset',
    paginated: false,
  })
  @Get('')
  public async getTrustedClaimIssuers(
    @Param() { asset }: AssetParamsDto
  ): Promise<ResultsModel<TrustedClaimIssuerModel>> {
    const results = await this.trustedClaimIssuersService.find(asset);
    return new ResultsModel({
      results: results.map(
        ({ identity: { did }, trustedFor }) => new TrustedClaimIssuerModel({ did, trustedFor })
      ),
    });
  }

  @ApiOperation({
    summary: 'Set trusted Claim Issuers of an Asset',
    description:
      'This endpoint will assign a new default list of trusted Claim Issuers to the Asset by replacing the existing ones',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose trusted Claim Issuers are to be set',
    type: 'string',
    example: '0xa3616b82e8e1080aedc952ea28b9db8b',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['Asset was not found', 'Some of the supplied Identities do not exist'],
    [HttpStatus.BAD_REQUEST]: ['The supplied claim issuer list is equal to the current one'],
  })
  @Post('set')
  public async setTrustedClaimIssuers(
    @Param() { asset }: AssetParamsDto,
    @Body() params: SetTrustedClaimIssuersDto
  ): Promise<TransactionResponseModel> {
    const result = await this.trustedClaimIssuersService.set(asset, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Add trusted Claim Issuers of an Asset',
    description:
      "This endpoint will add the supplied Identities to the Asset's list of trusted claim issuers",
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose trusted Claim Issuers are to be added',
    type: 'string',
    example: '0xa3616b82e8e1080aedc952ea28b9db8b',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['Asset was not found', 'Some of the supplied Identities do not exist'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: [
      'One or more of the supplied Identities already are Trusted Claim Issuers',
    ],
  })
  @Post('add')
  public async addTrustedClaimIssuers(
    @Param() { asset }: AssetParamsDto,
    @Body() params: SetTrustedClaimIssuersDto
  ): Promise<TransactionResponseModel> {
    const result = await this.trustedClaimIssuersService.add(asset, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Remove trusted Claim Issuers of an Asset',
    description:
      "This endpoint will remove the supplied Identities from the Asset's list of trusted claim issuers",
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose trusted Claim Issuers are to be removed',
    type: 'string',
    example: '0xa3616b82e8e1080aedc952ea28b9db8b',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['Asset was not found', 'Some of the supplied Identities do not exist'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: [
      'One or more of the supplied Identities are not Trusted Claim Issuers',
    ],
  })
  @Post('remove')
  public async removeTrustedClaimIssuers(
    @Param() { asset }: AssetParamsDto,
    @Body() params: RemoveTrustedClaimIssuersDto
  ): Promise<TransactionResponseModel> {
    const result = await this.trustedClaimIssuersService.remove(asset, params);

    return handleServiceResult(result);
  }
}
