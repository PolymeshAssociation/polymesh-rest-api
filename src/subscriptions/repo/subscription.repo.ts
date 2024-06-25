import { SubscriptionModel } from '~/subscriptions/models/subscription.model';
import { testSubscriptionRepo } from '~/subscriptions/repo/subscription.repo.suite';
import { SubscriptionParams } from '~/subscriptions/types';

export abstract class SubscriptionRepo {
  public static readonly type = 'Subscription';

  public abstract create(
    params: Omit<SubscriptionModel, 'id' | 'isExpired'>
  ): Promise<SubscriptionModel>;

  public abstract findAll(): Promise<SubscriptionModel[]>;

  public abstract findById(id: number): Promise<SubscriptionModel | undefined>;

  public abstract update(
    id: number,
    params: Partial<SubscriptionParams>
  ): Promise<SubscriptionModel>;

  public abstract incrementNonces(id: number[]): Promise<void>;

  /**
   * a set of tests implementers should pass
   */
  public static async test(repo: SubscriptionRepo): Promise<void> {
    return testSubscriptionRepo(repo);
  }
}
