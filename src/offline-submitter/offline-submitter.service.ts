import { Injectable } from '@nestjs/common';

import { ArtemisService } from '~/artemis/artemis.service';
import { TopicName } from '~/common/utils/amqp';
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
    this.artemisService.registerListener(TopicName.Submissions, msg => this.submit(msg));
  }

  private async submit(body: unknown): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { transaction: payload, signature } = body as any;

    const result = await this.polymeshService.polymeshApi.network.submitTransaction(
      payload,
      signature
    );

    const msg = JSON.parse(JSON.stringify(result));

    await this.artemisService.sendMessage(TopicName.Finalizations, msg);
  }
}
