import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { GenericPolymeshTransaction } from '@polymeshassociation/polymesh-sdk/types';
import { randomUUID } from 'crypto';

import { ArtemisService } from '~/artemis/artemis.service';
import { AppConfigError } from '~/common/errors';
import { AddressName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { OfflineReceiptModel } from '~/offline-starter/models/offline-receipt.model';
import { OfflineRequestModel } from '~/offline-starter/models/offline-request.model';

@Injectable()
export class OfflineStarterService {
  constructor(
    private readonly artemisService: ArtemisService,
    private readonly logger: PolymeshLogger
  ) {}

  /**
   * Begins offline transaction processing by placing signablePayload onto the queue
   */
  public async beginTransaction<ReturnType, TransformedReturnType>(
    transaction: GenericPolymeshTransaction<ReturnType, TransformedReturnType>,
    metadata?: Record<string, string>
  ): Promise<OfflineReceiptModel> {
    if (!this.artemisService.isConfigured()) {
      throw new AppConfigError('artemis', 'service is not configured');
    }

    const internalTxId = this.generateTxId();

    const payload = await transaction.toSignablePayload({ ...metadata, internalTxId });

    const request = new OfflineRequestModel({
      id: internalTxId,
      payload,
    });
    const topicName = AddressName.Requests;

    this.logger.debug(`sending topic: ${topicName}`, topicName);
    const delivery = await this.artemisService.sendMessage(topicName, request);

    const model = new OfflineReceiptModel({
      id: internalTxId,
      deliveryId: new BigNumber(delivery.id),
      payload: payload.payload,
      metadata: payload.metadata,
      topicName,
    });

    return model;
  }

  /**
   * generates internal book keeping fields
   */
  private generateTxId(): string {
    return randomUUID();
  }
}
