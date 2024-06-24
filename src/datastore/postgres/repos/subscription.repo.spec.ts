import { createMock } from '@golevelup/ts-jest';
import { when } from 'jest-when';
import { Repository } from 'typeorm';

import { Subscription } from '~/datastore/postgres/entities/subscription.entity';
import { PostgresSubscriptionRepo } from '~/datastore/postgres/repos/subscription.repo';
import { SubscriptionModel } from '~/subscriptions/models/subscription.model';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
import { MockPostgresRepository, MockQueryBuilder } from '~/test-utils/repo-mocks';

describe(`PostgresSubscriptionRepo ${SubscriptionRepo.type} test suite`, () => {
  const mockRepository = new MockPostgresRepository();
  const mockQueryBuilder = new MockQueryBuilder();
  const repo = new PostgresSubscriptionRepo(mockRepository as unknown as Repository<Subscription>);
  let _id = 1;

  const mockSubscription = createMock<SubscriptionModel>();
  when(mockRepository.findOneBy).calledWith({ id: 1 }).mockResolvedValue(mockSubscription);

  mockRepository.find.mockResolvedValue([]);
  mockRepository.update.mockImplementation((id, args) => {
    const newSub = { ...mockSubscription, id, ...args };

    when(mockRepository.findOneBy).calledWith({ id: newSub.id }).mockResolvedValue(newSub);
  });

  mockRepository.create.mockImplementation(params => params);
  mockRepository.findOneBy.mockResolvedValue(null);

  mockRepository.save.mockImplementation(async subscription => {
    subscription.id = _id++;
    when(mockRepository.findOneBy)
      .calledWith({ id: subscription.id })
      .mockResolvedValue(subscription);

    const existingSubs = await mockRepository.find();
    mockRepository.find.mockResolvedValue([...existingSubs, subscription]);
  });

  mockQueryBuilder.execute.mockImplementation(async () => {
    const existingSubs: SubscriptionModel[] = await mockRepository.find();

    const updatedSubs = existingSubs.map(sub => ({ ...sub, nextNonce: sub.nextNonce + 1 }));

    mockRepository.find.mockResolvedValue(updatedSubs);

    updatedSubs.forEach(sub => {
      when(mockRepository.findOneBy).calledWith({ id: sub.id }).mockResolvedValue(sub);
    });

    return { affected: updatedSubs.length };
  });

  mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

  SubscriptionRepo.test(repo);
});
