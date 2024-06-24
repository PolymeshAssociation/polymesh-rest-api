import { LocalSubscriptionRepo } from '~/datastore/local-store/repos/subscription.repo';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';

describe(`LocalSubscriptionRepo ${SubscriptionRepo.type} test suite`, () => {
  const repo = new LocalSubscriptionRepo();

  SubscriptionRepo.test(repo);
});
