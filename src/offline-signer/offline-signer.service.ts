import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { TopicName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { OfflineSignatureModel } from '~/offline-signer/models/offline-signature.model';
import { OfflineTxModel } from '~/offline-submitter/models/offline-tx.model';
import { SigningService } from '~/signing/services';

/**
 * Takes a transaction from the queue, and requests a signature from a signing manager
 */
@Injectable()
export class OfflineSignerService {
  constructor(
    private readonly artemisService: ArtemisService,
    private readonly signingService: SigningService,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(OfflineSignerService.name);

    this.artemisService.registerListener(
      TopicName.Requests,
      /* istanbul ignore next */
      msg => this.autoSign(msg),
      OfflineTxModel
    );
  }

  public async autoSign(body: OfflineTxModel): Promise<void> {
    const { id: transactionId } = body;
    this.logger.debug(`received request for signature: ${transactionId}`);
    const signer = this.signingService.getSigningManager().getExternalSigner();

    const { signature } = await signer.signPayload(body.payload.payload);

    const model = new OfflineSignatureModel({ signature, id: body.id });

    this.logger.log(`signed transaction: ${transactionId}`);
    await this.artemisService.sendMessage(TopicName.Signatures, model);
  }
}
