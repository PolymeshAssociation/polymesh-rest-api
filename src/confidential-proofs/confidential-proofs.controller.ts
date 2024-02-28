import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { IdParamsDto } from '~/common/dto/id-params.dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { ConfidentialProofsService } from '~/confidential-proofs/confidential-proofs.service';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { SenderAffirmConfidentialTransactionDto } from '~/confidential-transactions/dto/sender-affirm-confidential-transaction.dto copy';

@Controller()
export class ConfidentialProofsController {
  constructor(
    private readonly confidentialProofsService: ConfidentialProofsService,
    private readonly confidentialTransactionsService: ConfidentialTransactionsService
  ) {}

  @ApiTags('confidential-accounts')
  @ApiOperation({
    summary: 'Get all Confidential Accounts',
    description:
      'This endpoint retrieves the list of all Confidential Accounts created on the Proof Server. Note, this needs the `PROOF_SERVER_URL` to be set in the environment',
  })
  @ApiOkResponse({
    description: 'List of Confidential Accounts',
    type: ConfidentialAccountModel,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({
    description: 'Proof server API is not set',
  })
  @Get('confidential-accounts')
  public async getAccounts(): Promise<ConfidentialAccountModel[]> {
    const result = await this.confidentialProofsService.getConfidentialAccounts();

    return result.map(
      ({ confidentialAccount: publicKey }) => new ConfidentialAccountModel({ publicKey })
    );
  }

  @ApiTags('confidential-accounts')
  @ApiOperation({
    summary: 'Create a Confidential Account',
    description:
      'This endpoint creates a new Confidential Account (ElGamal key pair) on the proof server. Note, this needs the `PROOF_SERVER_URL` to be set in the environment',
  })
  @ApiOkResponse({
    description: 'Public key of the newly created Confidential Account (ElGamal key pair)',
    type: ConfidentialAccountModel,
  })
  @ApiInternalServerErrorResponse({
    description: 'Proof server API is not set',
  })
  @Post('confidential-accounts/create')
  public async createAccount(): Promise<ConfidentialAccountModel> {
    const { confidentialAccount: publicKey } =
      await this.confidentialProofsService.createConfidentialAccount();

    return new ConfidentialAccountModel({ publicKey });
  }

  @ApiTags('confidential-transactions')
  @ApiOperation({
    summary: 'Affirm a leg of an existing Confidential Transaction as a Sender',
    description:
      'This endpoint will affirm a specific leg of a pending Confidential Transaction for the Sender. Note, this needs the `PROOF_SERVER_URL` to be set in the environment in order to generate the sender proof',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Transaction to be affirmed',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('confidential-transactions/:id/affirm-leg/sender')
  public async senderAffirmLeg(
    @Param() { id }: IdParamsDto,
    @Body() body: SenderAffirmConfidentialTransactionDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialTransactionsService.senderAffirmLeg(id, body);
    return handleServiceResult(result);
  }
}
