import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { validate } from 'class-validator';
import {
  AwaitableSender,
  AwaitableSendOptions,
  Connection,
  ConnectionOptions,
  Container,
  EventContext,
  Receiver,
  ReceiverEvents,
  ReceiverOptions,
  SenderOptions,
} from 'rhea-promise';

import { AppInternalError } from '~/common/errors';
import { AddressName, QueueName } from '~/common/utils/amqp';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { ArtemisConfig } from '~/message/artemis/types';
import { MessageReceipt } from '~/message/common';
import { EventHandler, MessageService } from '~/message/common/message.service';

interface AddressEntry {
  addressName: AddressName;
  sender: AwaitableSender;
}

type AddressStore = Record<AddressName, AddressEntry>;

@Injectable()
export class ArtemisService extends MessageService implements OnApplicationShutdown {
  private receivers: Receiver[] = [];
  private addressStore: Partial<AddressStore> = {};
  private connectionPromise?: Promise<Connection>;

  constructor(
    private readonly logger: PolymeshLogger,
    @Inject('ARTEMIS_CONFIG') private readonly config: ArtemisConfig
  ) {
    super();
    this.logger.setContext(ArtemisService.name);
    this.logger.debug('Artemis service initialized');

    if (!this.config.configured) {
      throw new AppInternalError(
        'Artemis service was constructed, but Artemis config values were not set'
      );
    }
  }

  public async onApplicationShutdown(signal?: string | undefined): Promise<void> {
    this.logger.debug(
      `artemis service received application shutdown request, sig: ${signal} - now closing connections`
    );

    const closePromises = [
      ...this.receivers.map(receiver => receiver.close()),
      ...this.addressEntries().map(entry => entry.sender.close()),
    ];

    this.logger.debug(`awaiting ${closePromises.length} connections to close`);

    const closeResults = await Promise.allSettled(closePromises);

    let successfulCloses = 0;
    for (const result of closeResults) {
      if (result.status === 'rejected') {
        this.logger.error(`error closing artemis connection: ${result.reason}`);
      } else {
        successfulCloses += 1;
      }
    }
    this.logger.debug(`successfully closed ${successfulCloses} connections`);

    const connection = await this.getConnection();

    await connection.close();
  }

  private addressEntries(): AddressEntry[] {
    const entries: AddressEntry[] = [];

    for (const key in this.addressStore) {
      const entry = this.addressStore[key as AddressName];
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  private connectOptions(): ConnectionOptions {
    return this.config as ConnectionOptions;
  }

  private sendOptions(): AwaitableSendOptions {
    return {
      timeoutInSeconds: 10,
    };
  }

  private receiverOptions(listenOn: QueueName): ReceiverOptions {
    /* istanbul ignore next: not worth mocking the lib callbacks for a log */
    const onSessionError = (context: EventContext): void => {
      const sessionError = context?.session?.error;
      this.logger.error(
        `session error occurred for receiver "${listenOn}": ${sessionError ?? 'unknown error'}`
      );
    };

    return {
      name: `${listenOn}`,
      credit_window: 1,
      autoaccept: false,
      autosettle: false,
      source: {
        address: listenOn,
        distribution_mode: 'move',
        durable: 2,
        expiry_policy: 'never',
      },
      onSessionError,
    };
  }

  private senderOptions(publishOn: AddressName): SenderOptions {
    return {
      name: `${publishOn}`,
      target: {
        address: publishOn,
      },
    };
  }

  public async sendMessage(publishOn: AddressName, body: unknown): Promise<MessageReceipt> {
    const { sender } = await this.getAddress(publishOn);

    const message = { body };

    const sendOptions = this.sendOptions();
    this.logger.debug(`sending message on: ${publishOn}`);
    const receipt = await sender.send(message, sendOptions);

    return {
      id: new BigNumber(receipt.id),
      topic: publishOn,
    };
  }

  /**
   * @param Model will be given to `class-validator` validate method to ensure expected payload is received
   *
   * @note `receiver` should have an error handler registered
   */
  public async registerListener<T extends object>(
    listenOn: QueueName,
    listener: EventHandler<T>,
    Model: new (params: T) => T
  ): Promise<void> {
    const receiver = await this.getReceiver(listenOn);

    receiver.on(ReceiverEvents.message, async (context: EventContext) => {
      this.logger.debug(`received message ${listenOn}`);
      /* istanbul ignore next: message cannot be acknowledge without `delivery` methods */
      if (!context.delivery) {
        throw new AppInternalError('message received without delivery methods');
      }

      if (context.message) {
        const model = new Model(context.message.body);
        const validationErrors = await validate(model);
        if (validationErrors.length) {
          this.logger.error(
            `validation errors for "${listenOn}": ${JSON.stringify(validationErrors)}`
          );

          context.delivery.reject({
            condition: 'validation error',
            description: `message was deemed invalid for model: ${Model.name}`,
          });

          return;
        }

        try {
          await listener(model);

          context.delivery.accept();
        } catch (error) {
          let message = 'unknown error';
          if (error instanceof Error) {
            message = error.message;
          }
          this.logger.error(
            `rejecting message for queue "${listenOn}", listener threw error: ${message}`
          );

          context.delivery.reject({
            condition: 'processing error',
            description: `error processing message: ${message}`,
          });
        }
      }
    });

    receiver.on(ReceiverEvents.receiverError, (context: EventContext) => {
      /* istanbul ignore next */
      const receiverError = context?.receiver?.error;
      this.logger.error(`an error occurred for receiver "${listenOn}": ${receiverError}`);
    });
  }

  private async getConnection(): Promise<Connection> {
    if (!this.connectionPromise) {
      const container = new Container();
      this.connectionPromise = container.connect(this.connectOptions());
    }

    return this.connectionPromise;
  }

  private async getAddress(addressName: AddressName): Promise<AddressEntry> {
    const entry = this.addressStore[addressName];
    if (entry) {
      return entry;
    }

    const connection = await this.getConnection();

    const sender = await connection.createAwaitableSender(this.senderOptions(addressName));

    this.logger.debug(`made publish connection: ${addressName}`);

    const newEntry = {
      addressName,
      sender,
    };

    this.addressStore[addressName] = newEntry;

    return newEntry;
  }

  private async getReceiver(queueName: QueueName): Promise<Receiver> {
    const connection = await this.getConnection();

    const receiver = await connection.createReceiver(this.receiverOptions(queueName));

    this.logger.debug(`made receiver: ${queueName}`);

    this.receivers.push(receiver);

    return receiver;
  }
}
