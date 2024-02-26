import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Method } from 'axios';
import { lastValueFrom } from 'rxjs';

import { AppConfigError } from '~/common/errors';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import proofServerConfig from '~/proof-server/config/proof-server.config';
import { ConfidentialAccountEntity } from '~/proof-server/entities/confidential-account.entity';

@Injectable()
export class ProofServerService {
  private apiPath: string;

  constructor(
    @Inject(proofServerConfig.KEY) config: ConfigType<typeof proofServerConfig>,
    private readonly httpService: HttpService,
    private readonly logger: PolymeshLogger
  ) {
    this.apiPath = config.proofServerApi;

    logger.setContext(ProofServerService.name);
  }

  /**
   * Asserts if proof server API was initialized
   */
  private assertProofServerInitialized(): void {
    if (this.apiPath.length === 0) {
      throw new AppConfigError('PROOF_SERVER_API', 'Proof server not initialized');
    }
  }

  /**
   * Make API requests to Proof Server
   */
  private async requestProofServer<T>(
    apiEndpoint: string,
    method: Method,
    data?: unknown
  ): Promise<T> {
    this.assertProofServerInitialized();

    const { status, data: responseBody } = await lastValueFrom(
      this.httpService.request({
        url: `${this.apiPath}/${apiEndpoint}`,
        method,
        data,
        timeout: 10000,
      })
    );

    if (status === HttpStatus.OK) {
      this.logger.log(`requestProofServer - Received OK status for endpoint : "${apiEndpoint}"`);

      return responseBody;
    }

    this.logger.error(
      `requestProofServer - Proof server responded with non-OK status : ${status} with message for the endpoint: ${apiEndpoint}`
    );

    throw new Error(`Proof server responded with non-OK status: ${status}`);
  }

  /**
   * Gets all confidential accounts present in the Proof Server
   */
  public async getConfidentialAccounts(): Promise<ConfidentialAccountEntity[]> {
    this.logger.debug('getConfidentialAccounts - Fetching Confidential accounts from proof server');

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
      encrypted_balance: string;
    }
  ): Promise<string> {
    this.logger.debug(
      `generateSenderProof - Generating sender proof for account ${confidentialAccount}`
    );

    return this.requestProofServer(`accounts/${confidentialAccount}/send`, 'POST', senderInfo);
  }
}
