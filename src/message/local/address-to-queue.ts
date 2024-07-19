import { AddressName, QueueName } from '~/common/utils/amqp';

export const addressToQueue: Record<AddressName, QueueName> = {
  [AddressName.Requests]: QueueName.Requests,
  [AddressName.Signatures]: QueueName.Signatures,
  [AddressName.Finalizations]: QueueName.Finalizations,
};
