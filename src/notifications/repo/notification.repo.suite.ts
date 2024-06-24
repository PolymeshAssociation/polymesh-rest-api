/* istanbul ignore file */

import { NotificationRepo } from '~/notifications/repo/notifications.repo';
import { NotificationStatus } from '~/notifications/types';

export const testNotificationRepo = async (notificationRepo: NotificationRepo): Promise<void> => {
  let id: number;

  describe('method: create', () => {
    it('should create a notification', async () => {
      const notification = await notificationRepo.create({
        status: NotificationStatus.Active,
        eventId: 0,
        subscriptionId: 1,
        nonce: 1,
        triesLeft: 3,
      });
      id = notification.id;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _, ...params } = notification;
      expect(params).toMatchSnapshot();
    });
  });

  describe('method: findById', () => {
    it('should find the created notification', async () => {
      const notification = await notificationRepo.findById(id);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _, ...params } = notification!;

      expect(params).toMatchSnapshot();
    });
  });

  describe('method: update', () => {
    it('should update the notification', async () => {
      await notificationRepo.update(id, { status: NotificationStatus.Acknowledged });

      const notification = await notificationRepo.findById(id);

      expect(notification?.status).toEqual(NotificationStatus.Acknowledged);
    });
  });
};
