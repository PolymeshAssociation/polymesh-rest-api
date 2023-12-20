import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppNotFoundError } from '~/common/errors';
import { OfflineTx } from '~/datastore/postgres/entities/offline-tx.entity';
import { convertTypeOrmErrorToAppError } from '~/datastore/postgres/repos/utils';
import { OfflineTxModel } from '~/offline-submitter/models/offline-tx.model';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';

@Injectable()
export class PostgresOfflineTxRepo implements OfflineTxRepo {
  constructor(@InjectRepository(OfflineTx) private readonly offlineTxRepo: Repository<OfflineTx>) {}

  public async createTx(params: OfflineTxModel): Promise<OfflineTxModel> {
    const entity = this.offlineTxRepo.create(params);

    await this.offlineTxRepo
      .save(entity)
      .catch(convertTypeOrmErrorToAppError('offlineTx', OfflineTxRepo.type));

    return this.toModel(entity);
  }

  public async findById(id: string): Promise<OfflineTxModel | undefined> {
    const entity = await this.offlineTxRepo.findOneBy({ id });

    if (!entity) {
      return undefined;
    }

    return this.toModel(entity);
  }

  public async updateTx(id: string, params: Partial<OfflineTxModel>): Promise<OfflineTxModel> {
    const entity = await this.offlineTxRepo.findOneBy({ id });
    if (!entity) {
      throw new AppNotFoundError(id, 'offlineTxModel');
    }

    const newEntity = { ...entity, ...params };

    await this.offlineTxRepo
      .save(newEntity)
      .catch(convertTypeOrmErrorToAppError('offlineTx', OfflineTxRepo.type));

    return this.toModel(newEntity);
  }

  private toModel(event: OfflineTx): OfflineTxModel {
    const { id, ...rest } = event;

    return new OfflineTxModel({
      id: id.toString(),
      ...rest,
    });
  }
}
