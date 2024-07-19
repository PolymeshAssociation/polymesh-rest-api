/* istanbul ignore file */

import { AddressName, QueueName } from '~/common/utils/amqp';
import { MessageService } from '~/message/common/message.service';
import { AnyModel } from '~/offline-recorder/model/any.model';

export const testMessageService = async (service: MessageService): Promise<void> => {
  describe('sending and receiving messages', () => {
    it('should register a listener', async () => {
      const mockListener = jest.fn();
      await service.registerListener(QueueName.Requests, mockListener, AnyModel);

      await service.sendMessage(AddressName.Requests, { someKey: 'someValue' });

      expect(mockListener).toHaveBeenCalled();
    });
  });
};
