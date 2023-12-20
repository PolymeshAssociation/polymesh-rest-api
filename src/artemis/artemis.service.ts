import { Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import { randomUUID } from 'crypto';
import {
  AwaitableSender,
  AwaitableSendOptions,
  ConnectionOptions,
  Container,
  Delivery,
  EventContext,
  Receiver,
  ReceiverEvents,
  ReceiverOptions,
  SenderOptions,
} from 'rhea-promise';

import { TopicName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

type EventHandler<T> = (params: T) => Promise<void>;

interface QueueEntry {
  queueName: TopicName;
  senders: AwaitableSender[];
  receivers: Receiver[];
}

type QueueStore = Record<TopicName, QueueEntry>;

@Injectable()
export class ArtemisService {
  private queueStore: Partial<QueueStore> = {};

  constructor(private readonly logger: PolymeshLogger) {
    this.logger.setContext(ArtemisService.name);
  }

  private connectOptions(): ConnectionOptions {
    const { ARTEMIS_HOST, ARTEMIS_USERNAME, ARTEMIS_PASSWORD, ARTEMIS_PORT } = process.env;

    return {
      port: Number(ARTEMIS_PORT),
      host: ARTEMIS_HOST,
      username: ARTEMIS_USERNAME,
      password: ARTEMIS_PASSWORD,
      operationTimeoutInSeconds: 10,
      transport: 'tcp',
    };
  }

  private sendOptions(): AwaitableSendOptions {
    return {
      timeoutInSeconds: 10,
    };
  }

  private receiverOptions(listenFor: TopicName): ReceiverOptions {
    return {
      name: `${listenFor}-${randomUUID()}`,
      credit_window: 10, // how many message to pre-fetch
      source: {
        address: listenFor,
      },
    };
  }

  private senderOptions(publishOn: TopicName): SenderOptions {
    return {
      name: `${publishOn}-${randomUUID()}`,
      target: {
        address: publishOn,
      },
    };
  }

  public async sendMessage(publishOn: TopicName, body: unknown): Promise<Delivery> {
    const {
      senders: [sender],
    } = await this.setupQueue(publishOn);

    const message = { body };

    const sendOptions = this.sendOptions();

    return sender.send(message, sendOptions);
  }

  /**
   * @param Model will be given to `class-validator` validate method to ensure expected payload is received
   *
   * @note `receiver` should have an error handler registered
   */
  public async registerListener<T extends object>(
    listenFor: TopicName,
    listener: EventHandler<T>,
    Model: new (params: T) => T
  ): Promise<void> {
    const {
      receivers: [receiver],
    } = await this.setupQueue(listenFor);

    receiver.on(ReceiverEvents.message, async (context: EventContext) => {
      if (context.message) {
        const model = new Model(context.message.body);
        const validationErrors = await validate(model);
        if (validationErrors.length) {
          this.logger.error(`Validation errors: ${JSON.stringify(validationErrors)}`);
        }

        listener(model);
      }
    });
  }

  private async setupQueue(topicName: TopicName): Promise<QueueEntry> {
    const entry = this.queueStore[topicName];
    if (entry) {
      return entry;
    }

    const container = new Container();
    const connection = await container.connect(this.connectOptions());

    const terminals = await Promise.all([
      connection.createAwaitableSender(this.senderOptions(topicName)),
      connection.createReceiver(this.receiverOptions(topicName)),
    ]);

    const newEntry = {
      queueName: topicName,
      senders: [terminals[0]],
      receivers: [terminals[1]],
    };

    this.queueStore[topicName] = newEntry;

    return newEntry;
  }
}
