/* istanbul ignore file */

import { FactoryProvider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { Column, DataSource, Entity, Repository } from 'typeorm';

import { BaseEntity } from '~/datastore/postgres/entities/base.entity';
import { OfflineTxStatus } from '~/offline-submitter/models/offline-tx.model';

@Entity()
export class OfflineTx extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  signature: string;

  @Column({ type: 'json' })
  payload: TransactionPayload;

  @Column({ type: 'text' })
  status: OfflineTxStatus;

  @Column({ type: 'text', nullable: true })
  blockHash: string;

  @Column({ type: 'text', nullable: true })
  txIndex: string;

  @Column({ type: 'text', nullable: true })
  txHash: string;
}

export const offlineTxRepoProvider: FactoryProvider = {
  provide: getRepositoryToken(OfflineTx),
  useFactory: async (dataSource: DataSource): Promise<Repository<OfflineTx>> => {
    return dataSource.getRepository(OfflineTx);
  },
  inject: [DataSource],
};
