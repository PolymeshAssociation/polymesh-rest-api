import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { AppNotFoundError } from '~/common/errors';
import { TopicName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { OfflineSignatureModel } from '~/offline-signer/models/offline-signature.model';
import { OfflineTxModel, OfflineTxStatus } from '~/offline-submitter/models/offline-tx.model';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { PolymeshService } from '~/polymesh/polymesh.service';

/**
 * Forwards a transaction payload and signature to the chain
 */
@Injectable()
export class OfflineSubmitterService {
  constructor(
    private readonly artemisService: ArtemisService,
    private readonly polymeshService: PolymeshService,
    private readonly offlineTxRepo: OfflineTxRepo,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(OfflineSubmitterService.name);
    this.artemisService.registerListener(
      TopicName.Requests,
      /* istanbul ignore next */
      msg => this.recordRequest(msg),
      OfflineTxModel
    );
    this.artemisService.registerListener(
      TopicName.Signatures,
      /* istanbul ignore next */
      msg => this.submit(msg),
      OfflineSignatureModel
    );
  }

  public async recordRequest(record: OfflineTxModel): Promise<void> {
    const { id } = record;
    this.logger.debug(`received transaction request: ${id}`);

    await this.offlineTxRepo.createTx(record);

    this.logger.log(`created transaction record: ${id}`);
  }

  /**
   * @note this assumes the tx request has already been recorded
   */
  public async submit(body: OfflineSignatureModel): Promise<void> {
    const { id, signature } = body;
    this.logger.debug(`received signature for: ${id}`);

    const transaction = await this.getTransaction(id);

    transaction.signature = signature;
    transaction.status = OfflineTxStatus.Signed;
    await this.updateTransaction(transaction);

    this.logger.log(`submitting transaction: ${id}`);
    const result = await this.polymeshService.polymeshApi.network.submitTransaction(
      transaction.payload,
      signature
    );
    this.logger.log(`transaction finalized: ${id}`);

    const msg = JSON.parse(JSON.stringify(result)); // make sure its serializes properly
    await this.artemisService.sendMessage(TopicName.Finalizations, msg);

    transaction.blockHash = result.blockHash as string;
    transaction.txIndex = result.txIndex as string;
    transaction.txHash = result.txHash as string;
    transaction.status = OfflineTxStatus.Finalized;
    await this.updateTransaction(transaction);
  }

  private async updateTransaction(tx: OfflineTxModel): Promise<void> {
    this.logger.debug(`updating transaction: ${tx.id} - ${tx.status}`);
    this.offlineTxRepo.updateTx(tx.id, tx);
    this.logger.debug(`transaction updated: ${tx.id} - ${tx.status}`);
  }

  private async getTransaction(txId: string): Promise<OfflineTxModel> {
    this.logger.debug(`getting transaction: ${txId}`);
    const tx = await this.offlineTxRepo.findById(txId);

    if (!tx) {
      this.logger.warn(`transaction not found ${txId}`);
      throw new AppNotFoundError(txId, 'offlineTx');
    }

    this.logger.debug(`found transaction: ${txId}`);
    return tx;
  }
}