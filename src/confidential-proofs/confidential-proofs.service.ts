import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Method } from 'axios';
import { lastValueFrom } from 'rxjs';

import { AppInternalError } from '~/common/errors';
import {
  deserializeObject,
  serializeObject,
} from '~/confidential-proofs/confidential-proofs.utils';
import confidentialProofsConfig from '~/confidential-proofs/config/confidential-proofs.config';
import { AuditorVerifySenderProofDto } from '~/confidential-proofs/dto/auditor-verify-sender-proof.dto';
import { ReceiverVerifySenderProofDto } from '~/confidential-proofs/dto/receiver-verify-sender-proof.dto';
import { ConfidentialAccountEntity } from '~/confidential-proofs/entities/confidential-account.entity';
import { SenderProofVerificationResponseModel } from '~/confidential-proofs/models/sender-proof-verification-response.model';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

@Injectable()
export class ConfidentialProofsService {
  private apiPath: string;

  constructor(
    @Inject(confidentialProofsConfig.KEY) config: ConfigType<typeof confidentialProofsConfig>,
    private readonly httpService: HttpService,
    private readonly logger: PolymeshLogger
  ) {
    this.apiPath = config.proofServerUrl;

    logger.setContext(ConfidentialProofsService.name);
  }

  /**
   * Make API requests to Proof Server
   */
  private async requestProofServer<T>(
    apiEndpoint: string,
    method: Method,
    data?: unknown
  ): Promise<T> {
    const { status, data: responseBody } = await lastValueFrom(
      this.httpService.request({
        url: `${this.apiPath}/${apiEndpoint}`,
        method,
        data: serializeObject(data),
        timeout: 10000,
      })
    );

    if (status !== HttpStatus.OK) {
      this.logger.error(
        `requestProofServer - Proof server responded with non-OK status : ${status} with message for the endpoint: ${apiEndpoint}`
      );

      throw new AppInternalError(`Proof server responded with non-OK status: ${status}`);
    }

    this.logger.log(`requestProofServer - Received OK status for endpoint : "${apiEndpoint}"`);

    return deserializeObject(responseBody) as T;
  }

  /**
   * Gets all confidential accounts present in the Proof Server
   */
  public async getConfidentialAccounts(): Promise<ConfidentialAccountEntity[]> {
    this.logger.debug('getConfidentialAccounts - Fetching Confidential Accounts from proof server');

    return this.requestProofServer<ConfidentialAccountEntity[]>('accounts', 'GET');
  }

  /**
   * Creates a new ElGamal key pair in the Proof Server and returns its public key
   */
  public async createConfidentialAccount(): Promise<ConfidentialAccountEntity> {
    this.logger.debug(
      'createConfidentialAccount - Creating a new Confidential account in proof server'
    );

    return this.requestProofServer<ConfidentialAccountEntity>('accounts', 'POST', {});
  }

  /**
   * Generates sender proof for a transaction leg. This will be used by the sender to affirm the transaction
   * @param confidentialAccount
   * @param senderInfo
   * @returns sender proof
   */
  public async generateSenderProof(
    confidentialAccount: string,
    senderInfo: {
      amount: number;
      auditors: string[];
      receiver: string;
      encryptedBalance: string;
    }
  ): Promise<string> {
    this.logger.debug(
      `generateSenderProof - Generating sender proof for account ${confidentialAccount}`
    );

    return this.requestProofServer(`accounts/${confidentialAccount}/send`, 'POST', senderInfo);
  }

  /**
   * Verifies sender proof as an auditor
   */
  public async verifySenderProofAsAuditor(
    confidentialAccount: string,
    params: AuditorVerifySenderProofDto
  ): Promise<SenderProofVerificationResponseModel> {
    this.logger.debug(
      `verifySenderProofAsAuditor - Verifying sender proof ${params.senderProof} for account ${confidentialAccount}`
    );

    return this.requestProofServer(
      `accounts/${confidentialAccount}/auditor_verify`,
      'POST',
      params
    );
  }

  /**
   * Verifies sender proof as a receiver
   */
  public async verifySenderProofAsReceiver(
    confidentialAccount: string,
    params: ReceiverVerifySenderProofDto
  ): Promise<SenderProofVerificationResponseModel> {
    this.logger.debug(
      `verifySenderProofAsReceiver - Generating sender proof ${params.senderProof} for account ${confidentialAccount}`
    );

    return this.requestProofServer(
      `accounts/${confidentialAccount}/receiver_verify`,
      'POST',
      params
    );
  }
}
