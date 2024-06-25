/* istanbul ignore file */

import { AppNotFoundError } from '~/common/errors';
import { EventType } from '~/events/types';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
import { SubscriptionStatus } from '~/subscriptions/types';

export const testSubscriptionRepo = async (subscriptionRepo: SubscriptionRepo): Promise<void> => {
  let id: number;

  describe('method: create', () => {
    it('should create a subscription', async () => {
      const subscription = await subscriptionRepo.create({
        status: SubscriptionStatus.Inactive,
        eventType: EventType.TransactionUpdate,
        eventScope: '',
        webhookUrl: 'http://example.com',
        legitimacySecret: 'someSecret',
        ttl: 10,
        triesLeft: 10,
        nextNonce: 3,
        createdAt: new Date('1987-10-14'),
      });

      id = subscription.id;
      expect(subscription).toMatchSnapshot();
    });
  });

  describe('method: findById', () => {
    it('should find the created notification', async () => {
      const subscription = await subscriptionRepo.findById(id);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _, ...params } = subscription!;

      expect(params).toMatchSnapshot();
    });

    it('should throw an error for an ID that does not exist', async () => {
      return expect(subscriptionRepo.findById(-1)).rejects.toThrow(AppNotFoundError);
    });
  });

  describe('method: update', () => {
    it('should update the notification', async () => {
      await subscriptionRepo.update(id, { status: SubscriptionStatus.Active });

      const subscription = await subscriptionRepo.findById(id);

      expect(subscription?.status).toEqual(SubscriptionStatus.Active);
    });
  });

  describe('method: findAll', () => {
    it('should return all of the subscriptions', async () => {
      const subscriptions = await subscriptionRepo.findAll();

      expect(subscriptions.length).toEqual(1);
      expect(subscriptions[0].id).toEqual(id);
    });
  });

  describe('method: incrementNonces', () => {
    it('should increment nonces', async () => {
      await subscriptionRepo.incrementNonces([id]);

      const subscription = await subscriptionRepo.findById(id);

      expect(subscription?.nextNonce).toEqual(4);
    });
  });
};
