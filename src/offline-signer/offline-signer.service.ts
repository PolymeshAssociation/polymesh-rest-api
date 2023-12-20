import { Injectable } from '@nestjs/common';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';

import { ArtemisService } from '~/artemis/artemis.service';
import { SigningService } from '~/signing/services';

/**
 * Takes a transaction from the queue, and requests a signature from a signing manager
 */
@Injectable()
export class OfflineSignerService {
  constructor(
    private readonly artemisService: ArtemisService,
    private readonly signingService: SigningService
  ) {
    this.artemisService.registerListener('started', msg => this.sign(msg));
  }

  private async sign(body: Record<string, unknown>): Promise<void> {
    const transaction = body as unknown as TransactionPayload;
    if (body.signature) {
      // TODO we should only be subscribed to pending transactions
      return;
    }
    const signer = this.signingService.getSigningManager().getExternalSigner();

    const { signature } = await signer.signPayload(transaction.payload);

    const message = { signature, transaction };

    this.artemisService.sendMessage('signed', message);
  }
}
