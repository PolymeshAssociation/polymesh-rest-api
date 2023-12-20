import { OfflineTxModel } from '~/offline-submitter/models/offline-tx.model';
import { testOfflineTxRepo } from '~/offline-submitter/repos/offline-tx.suite';

export abstract class OfflineTxRepo {
  public static type = 'OfflineTxRepo';

  public abstract createTx(params: OfflineTxModel): Promise<OfflineTxModel>;
  public abstract findById(id: string): Promise<OfflineTxModel | undefined>;
  public abstract updateTx(id: string, params: Partial<OfflineTxModel>): Promise<OfflineTxModel>;

  public static async test(repo: OfflineTxRepo): Promise<void> {
    return testOfflineTxRepo(repo);
  }
}
