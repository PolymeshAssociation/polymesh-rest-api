import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
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
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { ProofServerService } from '~/proof-server/proof-server.service';

@ApiTags('confidential-accounts')
@Controller('confidential-accounts')
export class ConfidentialAccountsController {
  constructor(
    private readonly confidentialAccountsService: ConfidentialAccountsService,
    private readonly proofServerService: ProofServerService
  ) {}

  @ApiOperation({
    summary: 'Get all Confidential Accounts',
    description:
      'This endpoint retrieves the list of all confidential Accounts created on the Proof Server. Note, this needs the `PROOF_SERVER_API` to be set in the environment',
  })
  @ApiOkResponse({
    description: 'List of Confidential Accounts',
    type: ConfidentialAccountModel,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({
    description: 'Proof server API is not set',
  })
  @Get()
  public async getAccounts(): Promise<ConfidentialAccountModel[]> {
    const result = await this.proofServerService.getConfidentialAccounts();

    return result.map(
      ({ confidential_account: publicKey }) => new ConfidentialAccountModel({ publicKey })
    );
  }

  @ApiOperation({
    summary: 'Create a Confidential Account',
    description:
      'This endpoint creates a new Confidential Account (ElGamal key pair) on the proof server. Note, this needs the `PROOF_SERVER_API` to be set in the environment',
  })
  @ApiOkResponse({
    description: 'Public key of the newly created Confidential Account (ElGamal key pair)',
    type: ConfidentialAccountModel,
  })
  @ApiInternalServerErrorResponse({
    description: 'Proof server API is not set',
  })
  @Post('create')
  public async createAccount(): Promise<ConfidentialAccountModel> {
    const { confidential_account: publicKey } =
      await this.proofServerService.createConfidentialAccount();

    return new ConfidentialAccountModel({ publicKey });
  }

  @Post(':confidentialAccount/map')
  @ApiOperation({
    summary: 'Map a Confidential Account to an Identity',
    description: 'This endpoint maps a given confidential Account to the signer on chain',
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
      'The given Confidential Account is already mapped to an Identity',
    ],
  })
  public async mapAccount(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto,
    @Body() params: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialAccountsService.mapConfidentialAccount(
      confidentialAccount,
      params
    );

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get owner of a Confidential Account',
    description:
      'This endpoint retrieves the DID to which a Confidential Account is mapped on chain',
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
  @Get(':confidentialAccount/owner')
  public async getOwner(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto
  ): Promise<IdentityModel> {
    const { did } = await this.confidentialAccountsService.fetchOwner(confidentialAccount);

    return new IdentityModel({ did });
  }
}
