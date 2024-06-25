import { LocalNotificationRepo } from '~/datastore/local-store/repos/notification.repo';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';

describe(`LocalNotificationRepo ${NotificationRepo.type} test suite`, () => {
  const repo = new LocalNotificationRepo();

  NotificationRepo.test(repo);
});
