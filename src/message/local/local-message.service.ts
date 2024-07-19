import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { validate } from 'class-validator';

import { AppInternalError } from '~/common/errors';
import { AddressName, QueueName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { MessageReceipt } from '~/message/common';
import { EventHandler, MessageService } from '~/message/common/message.service';
import { addressToQueue } from '~/message/local/address-to-queue';

@Injectable()
export class LocalMessageService extends MessageService {
  private listeners: Record<QueueName, EventHandler<unknown>[]>;
  private _id = 1;

  constructor(private readonly logger: PolymeshLogger) {
    super();
    this.logger.setContext(LocalMessageService.name);

    this.listeners = {} as Record<QueueName, EventHandler<unknown>[]>;
    Object.values(QueueName).forEach(queue => (this.listeners[queue] = []));
  }

  async sendMessage(publishOn: AddressName, message: unknown): Promise<MessageReceipt> {
    this.logger.debug(`sending msg on ${publishOn}`);
    const queue = addressToQueue[publishOn];
    const handlers = [...this.listeners[queue], ...this.listeners[QueueName.EventsLog]];

    await Promise.all(handlers.map(handler => handler(message)));

    return { id: new BigNumber(this._id++), topic: publishOn };
  }

  public async registerListener<T extends object>(
    listenOn: QueueName,
    listener: EventHandler<T>,
    Model: new (params: T) => T
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = async (message: any): Promise<void> => {
      this.logger.debug(`received message for: ${listenOn}`);
      const model = new Model(message);
      const validationErrors = await validate(model);

      if (validationErrors.length) {
        const errString = JSON.stringify(validationErrors);
        this.logger.error(`validation errors for "${listenOn}": ${errString}`);

        throw new AppInternalError(`received invalid message on "${listenOn}": ${errString}`);
      }

      listener(model);
    };

    this.listeners[listenOn].push(handler);
  }
}
