import { AnyModel } from '~/offline-recorder/model/any.model';
import { OfflineEventModel } from '~/offline-recorder/model/offline-event.model';
import { testOfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo.suite';

export abstract class OfflineEventRepo {
  public static type = 'OfflineEvent';

  public abstract recordEvent(name: string, body: AnyModel): Promise<OfflineEventModel>;

  /**
   * a set of tests implementers should pass
   */
  public static async test(repo: OfflineEventRepo): Promise<void> {
    return testOfflineEventRepo(repo);
  }
}
