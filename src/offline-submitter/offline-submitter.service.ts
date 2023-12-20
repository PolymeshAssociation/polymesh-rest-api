import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { PolymeshService } from '~/polymesh/polymesh.service';

/**
 * Forwards a transaction payload and signature to the chain
 */
@Injectable()
export class OfflineSubmitterService {
  constructor(
    private readonly artemisService: ArtemisService,
    private readonly polymeshService: PolymeshService
  ) {
    this.artemisService.registerListener('signed', msg => this.submit(msg));
  }

  private async submit(body: unknown): Promise<void> {
    // log received msg...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { transaction: payload, signature } = body as any;

    const result = await this.polymeshService.polymeshApi.network.submitTransaction(
      payload,
      signature
    );

    console.log({ result });
  }
}
