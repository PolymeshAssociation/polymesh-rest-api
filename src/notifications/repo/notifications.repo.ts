import { NotificationModel } from '~/notifications/model/notification.model';
import { testNotificationRepo } from '~/notifications/repo/notification.repo.suite';
import { NotificationParams } from '~/notifications/types';

export abstract class NotificationRepo {
  public static readonly type = 'Notification';

  public abstract create(params: NotificationParams): Promise<NotificationModel>;
  public abstract findById(id: number): Promise<NotificationModel | undefined>;
  public abstract update(
    id: number,
    params: Partial<NotificationParams>
  ): Promise<NotificationModel>;

  /**
   * a set of tests implementers should pass
   */
  public static async test(repo: NotificationRepo): Promise<void> {
    return testNotificationRepo(repo);
  }
}
