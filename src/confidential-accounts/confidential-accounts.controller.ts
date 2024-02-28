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
}
