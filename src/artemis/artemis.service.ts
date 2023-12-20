import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AwaitableSender,
  Connection,
  ConnectionOptions,
  Delivery,
  EventContext,
  Receiver,
  ReceiverEvents,
  ReceiverOptions,
  SenderOptions,
} from 'rhea-promise';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';

type Listener = (context: Record<string, unknown>) => void;

@Injectable()
export class ArtemisService {
  private connection: Connection;
  private sender: AwaitableSender;
  private receiver: Receiver;
  private listeners: Listener[] = [];

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

  private receiverOptions(listenFor: string): ReceiverOptions {
    return {
      name: randomUUID(),
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

  private senderOptions(publishOn: string): SenderOptions {
    return {
      name: 'exampleSender',
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

  public async sendMessage(publishOn: string, body: Record<string, unknown>): Promise<void> {
    const message = { body };

    if (!this.connection) {
      const connection = new Connection(this.connectOptions());
      await connection.open();
    }

    this.sender =
      this.sender ?? (await this.connection.createAwaitableSender(this.senderOptions(publishOn)));

    const sendOptions = { timeoutInSeconds: 10 };

    await this.sender.send(message, sendOptions);
  }

  public async registerListener(listenFor: string, listener: Listener): Promise<void> {
    this.listeners.push(listener);

    if (!this.connection) {
      this.connection = new Connection(this.connectOptions());
      await this.connection.open();
    }

    if (!this.receiver) {
      this.receiver = await this.connection.createReceiver(this.receiverOptions(listenFor));

      // TODO each listener should have its own queue. There shouldn't be fan out here
      this.receiver.on(ReceiverEvents.message, (context: EventContext) => {
        if (context.message) {
          this.listeners.forEach(worker => worker(context.message?.body));
        } else {
          this.logger.debug('no message received');
        }
      });
      this.receiver.on(ReceiverEvents.receiverError, (context: EventContext) => {
        const receiverError = context.receiver && context.receiver.error;
        if (receiverError) {
          this.logger.error('receiver error: ', receiverError);
        }
      });
    }
  }
}
