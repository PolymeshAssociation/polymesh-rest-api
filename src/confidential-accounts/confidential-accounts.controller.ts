import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { ConfidentialAccountParamsDto } from '~/confidential-accounts/dto/confidential-account-params.dto';
import { ConfidentialAssetBalanceModel } from '~/confidential-accounts/models/confidential-asset-balance.model';
import { ConfidentialAssetIdParamsDto } from '~/confidential-assets/dto/confidential-asset-id-params.dto';
import { IdentityModel } from '~/identities/models/identity.model';

@ApiTags('confidential-accounts')
@Controller('confidential-accounts')
export class ConfidentialAccountsController {
  constructor(private readonly confidentialAccountsService: ConfidentialAccountsService) {}

  @Post(':confidentialAccount/link')
  @ApiOperation({
    summary: 'Links a Confidential Account to an Identity',
    description: 'This endpoint links a given confidential Account to the signer on chain',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: [
      'The given Confidential Account is already linked to an Identity',
    ],
  })
  public async linkAccount(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto,
    @Body() params: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialAccountsService.linkConfidentialAccount(
      confidentialAccount,
      params
    );

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get owner of a Confidential Account',
    description:
      'This endpoint retrieves the DID to which a Confidential Account is linked to on chain',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'DID of the owner of the Confidential Account',
    type: IdentityModel,
  })
  @ApiNotFoundResponse({
    description: 'No owner exists for the Confidential Account',
  })
  @Get(':confidentialAccount/owner')
  public async getOwner(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto
  ): Promise<IdentityModel> {
    const { did } = await this.confidentialAccountsService.fetchOwner(confidentialAccount);

    return new IdentityModel({ did });
  }

  @ApiOperation({
    summary: 'Get all Confidential Asset balances',
    description:
      'This endpoint retrieves the balances of all the Confidential Assets held by a Confidential Account',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'List of all incoming Confidential Asset balances',
    type: ConfidentialAssetBalanceModel,
    isArray: true,
  })
  @Get(':confidentialAccount/balances')
  public async getAllBalances(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto
  ): Promise<ConfidentialAssetBalanceModel[]> {
    const results = await this.confidentialAccountsService.getAllBalances(confidentialAccount);

    return results.map(
      ({ confidentialAsset: { id: confidentialAsset }, balance }) =>
        new ConfidentialAssetBalanceModel({ confidentialAsset, balance })
    );
  }

  @ApiOperation({
    summary: 'Get balance of a specific Confidential Asset',
    description:
      'This endpoint retrieves the existing balance of a specific Confidential Asset in the given Confidential Account',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiParam({
    name: 'confidentialAssetId',
    description: 'The ID of the Confidential Asset whose balance is to be fetched',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  @ApiOkResponse({
    description: 'Encrypted balance of the Confidential Asset',
    type: 'string',
  })
  @ApiNotFoundResponse({
    description: 'No balance is found for the given Confidential Asset',
  })
  @Get(':confidentialAccount/balances/:confidentialAssetId')
  public async getConfidentialAssetBalance(
    @Param()
    {
      confidentialAccount,
      confidentialAssetId,
    }: ConfidentialAccountParamsDto & ConfidentialAssetIdParamsDto
  ): Promise<string> {
    return this.confidentialAccountsService.getAssetBalance(
      confidentialAccount,
      confidentialAssetId
    );
  }

  @ApiOperation({
    summary: 'Get all incoming Confidential Asset balances',
    description:
      'This endpoint retrieves the incoming balances of all the Confidential Assets held by a Confidential Account',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'List of all incoming Confidential Asset balances',
    type: ConfidentialAssetBalanceModel,
    isArray: true,
  })
  @Get(':confidentialAccount/incoming-balances')
  public async getAllIncomingBalances(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto
  ): Promise<ConfidentialAssetBalanceModel[]> {
    const results = await this.confidentialAccountsService.getAllIncomingBalances(
      confidentialAccount
    );

    return results.map(
      ({ confidentialAsset: { id: confidentialAsset }, balance }) =>
        new ConfidentialAssetBalanceModel({ confidentialAsset, balance })
    );
  }

  @ApiOperation({
    summary: 'Get incoming balance of a specific Confidential Asset',
    description:
      'This endpoint retrieves the incoming balance of a specific Confidential Asset in the given Confidential Account',
  })
  @ApiParam({
    name: 'confidentialAssetId',
    description: 'The ID of the Confidential Asset for which the incoming balance is to be fetched',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
    type: 'string',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Confidential Account',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Encrypted incoming balance of the Confidential Asset',
    type: 'string',
  })
  @ApiNotFoundResponse({
    description: 'No incoming balance is found for the given Confidential Asset',
  })
  @Get(':confidentialAccount/incoming-balances/:confidentialAssetId')
  public async getIncomingConfidentialAssetBalance(
    @Param()
    {
      confidentialAccount,
      confidentialAssetId,
    }: ConfidentialAccountParamsDto & ConfidentialAssetIdParamsDto
  ): Promise<string> {
    return this.confidentialAccountsService.getIncomingAssetBalance(
      confidentialAccount,
      confidentialAssetId
    );
  }
}
