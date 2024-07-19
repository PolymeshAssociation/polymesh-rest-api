import { QueueName } from '~/common/utils/amqp';
import { MessageReceipt } from '~/message/common';
import { testMessageService } from '~/message/common/message.service.suite';

export type EventHandler<T> = (params: T) => Promise<void>;

export abstract class MessageService {
  public abstract sendMessage(topic: string, message: unknown): Promise<MessageReceipt>;
  public abstract registerListener<T extends object>(
    listenOn: QueueName,
    listener: EventHandler<T>,
    Model: new (params: T) => T
  ): Promise<void>;

  /**
   * a set of tests implementations should pass
   */
  public static async test(service: MessageService): Promise<void> {
    return testMessageService(service);
  }
}
