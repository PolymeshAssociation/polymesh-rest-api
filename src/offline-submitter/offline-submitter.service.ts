import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { AddressName, QueueName } from '~/common/utils/amqp';
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
      QueueName.Signatures,
      /* istanbul ignore next */
      msg => this.submit(msg),
      OfflineSignatureModel
    );
  }

  /**
   * @note this assumes the tx request has already been recorded
   */
  public async submit(body: OfflineSignatureModel): Promise<void> {
    const { id, signature, payload } = body;
    const { address, nonce: rawNonce } = payload.payload;
    const nonce = parseInt(rawNonce, 16);
    this.logger.debug(`received signature for: ${id}`);

    const transaction = await this.offlineTxRepo.createTx({
      id,
      payload,
      status: OfflineTxStatus.Signed,
      signature,
      address,
      nonce,
    });

    this.logger.log(`submitting transaction: ${id}`);
    const result = await this.polymeshService.polymeshApi.network.submitTransaction(
      transaction.payload,
      signature
    );
    this.logger.log(`transaction finalized: ${id}`);

    const resultData = JSON.parse(JSON.stringify(result)); // make sure its serializes properly

    const finalizationMsg = {
      ...resultData,
      id,
      address,
      nonce,
    };

    await this.artemisService.sendMessage(AddressName.Finalizations, finalizationMsg);

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
}
