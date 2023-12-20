import { Injectable } from '@nestjs/common';
import { GenericPolymeshTransaction } from '@polymeshassociation/polymesh-sdk/types';
import { randomUUID } from 'crypto';

import { ArtemisService } from '~/artemis/artemis.service';

@Injectable()
export class OfflineStarterService {
  constructor(private readonly artemisService: ArtemisService) {}

  /**
   * Begins offline transaction processing by placing signablePayload onto the queue
   */
  public async beginTransaction<ReturnType, TransformedReturnType>(
    transaction: GenericPolymeshTransaction<ReturnType, TransformedReturnType>,
    metadata?: Record<string, string>
  ): Promise<void> {
    const internalMeta = this.generateMeta();
    const payload = await transaction.toSignablePayload({ ...internalMeta, ...metadata });

    await this.artemisService.sendMessage('started', payload as unknown as Record<string, unknown>);
  }

  /**
   * generates internal book keeping fields
   */
  private generateMeta(): Record<string, string> {
    const internalId = randomUUID();
    const generatedAt = (+new Date() / 1000).toFixed(0);

    return { meshId: internalId, timestamp: generatedAt };
  }
}
