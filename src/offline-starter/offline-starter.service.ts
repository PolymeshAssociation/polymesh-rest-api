import { Injectable } from '@nestjs/common';
import { GenericPolymeshTransaction } from '@polymeshassociation/polymesh-sdk/types';
import { randomUUID } from 'crypto';

import { AddressName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { MessageService } from '~/message/common/message.service';
import { OfflineReceiptModel } from '~/offline-starter/models/offline-receipt.model';
import { OfflineRequestModel } from '~/offline-starter/models/offline-request.model';

@Injectable()
export class OfflineStarterService {
  constructor(
    private readonly messageService: MessageService,
    private readonly logger: PolymeshLogger
  ) {}

  /**
   * Begins offline transaction processing by placing signablePayload onto the queue
   */
  public async beginTransaction<ReturnType, TransformedReturnType>(
    transaction: GenericPolymeshTransaction<ReturnType, TransformedReturnType>,
    metadata?: Record<string, string>
  ): Promise<OfflineReceiptModel> {
    const internalTxId = this.generateTxId();

    const payload = await transaction.toSignablePayload({ ...metadata, internalTxId });

    const request = new OfflineRequestModel({
      id: internalTxId,
      payload,
    });
    const topicName = AddressName.Requests;

    this.logger.debug(`sending topic: ${topicName}`);
    const { id: deliveryId } = await this.messageService.sendMessage(topicName, request);

    const model = new OfflineReceiptModel({
      id: internalTxId,
      deliveryId,
      payload: payload.payload,
      metadata: payload.metadata,
      topicName,
      multiSig: payload.multiSig,
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
