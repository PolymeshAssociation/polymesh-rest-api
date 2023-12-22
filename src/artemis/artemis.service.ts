import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AwaitableSender,
  ConnectionOptions,
  Container,
  EventContext,
  Receiver,
  ReceiverEvents,
  ReceiverOptions,
  SenderOptions,
} from 'rhea-promise';

import { TopicName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

type EventHandler = (context: Record<string, unknown>) => void;

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
    return {
      port: 5672,
      host: 'localhost',
      username: 'artemis',
      password: 'artemis',
      operationTimeoutInSeconds: 10,
      transport: 'tcp',
    };
  }

  private receiverOptions(listenFor: TopicName): ReceiverOptions {
    return {
      name: `${listenFor}-${randomUUID()}`,
      credit_window: 10, // how many message to pre-fetch
      source: {
        address: listenFor,
      },
      onSessionError: async (context: EventContext): Promise<void> => {
        const sessionError = context.session && context.session.error;
        if (sessionError) {
          this.logger.error('Receiver session error: %O', sessionError);
        }
      },
    };
  }

  private senderOptions(publishOn: TopicName): SenderOptions {
    return {
      name: `${publishOn}-${randomUUID()}`,
      target: {
        address: publishOn,
      },
      onError: async (context: EventContext): Promise<void> => {
        const senderError = context.sender && context.sender.error;
        if (senderError) {
          this.logger.error('error occurred for sender: %O', senderError);
        }
      },
      onSessionError: async (context: EventContext): Promise<void> => {
        const sessionError = context.session && context.session.error;
        if (sessionError) {
          this.logger.error('>>>>> session error occurred for sender: %O', sessionError);
        }
      },
    };
  }

  public async sendMessage(publishOn: TopicName, body: Record<string, unknown>): Promise<void> {
    const {
      senders: [sender],
    } = await this.setupQueue(publishOn);

    const message = { body };

    const sendOptions = { timeoutInSeconds: 10 };

    await sender.send(message, sendOptions);
  }

  // TODO add error handler
  public async registerListener(listenFor: TopicName, listener: EventHandler): Promise<void> {
    const {
      receivers: [receiver],
    } = await this.setupQueue(listenFor);

    receiver.on(ReceiverEvents.message, (context: EventContext) => {
      if (context.message) {
        listener(context.message?.body);
      } else {
        this.logger.debug('no message received');
      }
    });
    receiver.on(ReceiverEvents.receiverError, (context: EventContext) => {
      const receiverError = context.receiver && context.receiver.error;
      if (receiverError) {
        this.logger.error('receiver error: ', receiverError);
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
