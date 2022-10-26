/* istanbul ignore file */

import { FactoryProvider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Column, DataSource, Entity, Index, ManyToOne, Repository } from 'typeorm';

import { BaseEntity } from '~/datastore/postgres/entities/base.entity';
import { User } from '~/datastore/postgres/entities/user.entity';

@Entity()
export class ApiKey extends BaseEntity {
  @Index()
  @Column({ type: 'text' })
  secret: string;

  @ManyToOne(() => User)
  @Column({ type: 'text' })
  user: User;
}

export const apiKeyRepoProvider: FactoryProvider = {
  provide: getRepositoryToken(ApiKey),
  useFactory: async (dataSource: DataSource): Promise<Repository<ApiKey>> => {
    return dataSource.getRepository(ApiKey);
  },
  inject: ['PG_SOURCE'],
};
