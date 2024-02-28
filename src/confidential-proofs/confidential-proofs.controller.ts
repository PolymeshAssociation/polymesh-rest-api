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
import { ConfidentialAccountParamsDto } from '~/confidential-accounts/dto/confidential-account-params.dto';
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { ConfidentialProofsService } from '~/confidential-proofs/confidential-proofs.service';
import { AuditorVerifySenderProofDto } from '~/confidential-proofs/dto/auditor-verify-sender-proof.dto';
import { DecryptBalanceDto } from '~/confidential-proofs/dto/decrypt-balance.dto';
import { ReceiverVerifySenderProofDto } from '~/confidential-proofs/dto/receiver-verify-sender-proof.dto';
import { DecryptedBalanceModel } from '~/confidential-proofs/models/decrypted-balance.model';
import { SenderProofVerificationResponseModel } from '~/confidential-proofs/models/sender-proof-verification-response.model';
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
    description: 'Proof server returned a non-OK status',
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
  @ApiInternalServerErrorResponse({
    description: 'Proof server returned a non-OK status',
  })
  @Post('confidential-transactions/:id/affirm-leg/sender')
  public async senderAffirmLeg(
    @Param() { id }: IdParamsDto,
    @Body() body: SenderAffirmConfidentialTransactionDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialTransactionsService.senderAffirmLeg(id, body);
    return handleServiceResult(result);
  }

  @ApiTags('confidential-accounts')
  @ApiOperation({
    summary: 'Verify a sender proof as an auditor',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Auditor Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'Details about the verification',
    type: SenderProofVerificationResponseModel,
  })
  @ApiInternalServerErrorResponse({
    description: 'Proof server returned a non-OK status',
  })
  @Post('confidential-accounts/:confidentialAccount/auditor-verify')
  public async verifySenderProofAsAuditor(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto,
    @Body() params: AuditorVerifySenderProofDto
  ): Promise<SenderProofVerificationResponseModel> {
    return this.confidentialProofsService.verifySenderProofAsAuditor(confidentialAccount, params);
  }

  @ApiTags('confidential-accounts')
  @ApiOperation({
    summary: 'Verify a sender proof as an auditor',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the receiver Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'Details about the verification',
    type: SenderProofVerificationResponseModel,
  })
  @ApiInternalServerErrorResponse({
    description: 'Proof server returned a non-OK status',
  })
  @Post('confidential-accounts/:confidentialAccount/receiver-verify')
  public async verifySenderProofAsReceiver(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto,
    @Body() params: ReceiverVerifySenderProofDto
  ): Promise<SenderProofVerificationResponseModel> {
    return this.confidentialProofsService.verifySenderProofAsReceiver(confidentialAccount, params);
  }

  @ApiTags('confidential-accounts')
  @ApiOperation({
    summary: 'Decrypts an encrypted balance for a Confidential Account',
  })
  @ApiParam({
    name: 'confidentialAccount',
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'Decrypted balance value',
    type: DecryptedBalanceModel,
  })
  @ApiInternalServerErrorResponse({
    description: 'Proof server returned a non-OK status',
  })
  @Post('confidential-accounts/:confidentialAccount/decrypt-balance')
  public async decryptBalance(
    @Param() { confidentialAccount }: ConfidentialAccountParamsDto,
    @Body() params: DecryptBalanceDto
  ): Promise<DecryptedBalanceModel> {
    return this.confidentialProofsService.decryptBalance(confidentialAccount, params);
  }
}
