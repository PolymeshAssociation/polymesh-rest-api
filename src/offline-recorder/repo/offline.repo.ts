import { OfflineEventModel } from '~/offline-recorder/model/event.model';
import { testOfflineRepo } from '~/offline-recorder/repo/offline.repo.suite';

export abstract class OfflineRepo {
  public static type = 'Offline';

  public abstract recordEvent(
    name: string,
    body: Record<string, unknown>
  ): Promise<OfflineEventModel>;

  /**
   * a set of tests implementers should pass
   */
  public static async test(repo: OfflineRepo): Promise<void> {
    return testOfflineRepo(repo);
  }
}
