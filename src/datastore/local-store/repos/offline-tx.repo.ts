import { Injectable } from '@nestjs/common';

import { AppNotFoundError } from '~/common/errors';
import { OfflineTxModel } from '~/offline-submitter/models/offline-tx.model';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';

@Injectable()
export class LocalOfflineTxRepo implements OfflineTxRepo {
  private transactions: Record<string, OfflineTxModel> = {};
  private _id: number = 1;

  public async createTx(transaction: OfflineTxModel): Promise<OfflineTxModel> {
    const id = this.nextId();
    const model = { ...transaction, id };
    this.transactions[id] = model;

    return model;
  }

  public async findById(id: string): Promise<OfflineTxModel | undefined> {
    const model = this.transactions[id];

    return model;
  }

  public async updateTx(id: string, params: Partial<OfflineTxModel>): Promise<OfflineTxModel> {
    const model = this.transactions[id];

    if (!model) {
      throw new AppNotFoundError(id, 'offlineTxModel');
    }

    const newModel = { ...model, ...params };

    this.transactions[id] = newModel;

    return newModel;
  }

  private nextId(): string {
    return (this._id++).toString();
  }
}
