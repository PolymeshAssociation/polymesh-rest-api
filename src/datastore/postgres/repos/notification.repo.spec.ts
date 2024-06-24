import { createMock } from '@golevelup/ts-jest';
import { when } from 'jest-when';
import { Repository } from 'typeorm';

import { Notification } from '~/datastore/postgres/entities/notification.entity';
import { PostgresNotificationRepo } from '~/datastore/postgres/repos/notification.repo';
import { NotificationModel } from '~/notifications/model/notification.model';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';
import { MockPostgresRepository } from '~/test-utils/repo-mocks';

describe(`PostgresNotificationRepo ${NotificationRepo.type} test suite`, () => {
  const mockRepository = new MockPostgresRepository();
  const repo = new PostgresNotificationRepo(mockRepository as unknown as Repository<Notification>);

  const mockNotification = createMock<NotificationModel>({
    id: 1,
  });

  mockRepository.save.mockImplementation(notification => {
    notification.id = 1;
    return mockNotification;
  });

  mockRepository.update.mockImplementation(async (id, params) => {
    const notification = mockRepository.findOneBy(id);

    when(mockRepository.findOneBy)
      .calledWith({ id })
      .mockResolvedValue({ ...notification, ...params });
  });

  mockRepository.create.mockImplementation(params => params);
  when(mockRepository.findOneBy)
    .calledWith({ id: mockNotification.id })
    .mockResolvedValue(mockNotification);

  NotificationRepo.test(repo);
});
