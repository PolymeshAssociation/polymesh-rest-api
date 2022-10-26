/* istanbul ignore file */

import { FactoryProvider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Check, Column, DataSource, Entity, Repository } from 'typeorm';

import { BaseEntity } from '~/datastore/postgres/entities/base.entity';
import { PG_SOURCE } from '~/datastore/postgres/source';

@Entity()
@Check('LENGTH(name) < 127') //  arbitrary length sanity check
export class User extends BaseEntity {
  @Column({ type: 'text', unique: true })
  name: string;
}

export const userRepoProvider: FactoryProvider = {
  provide: getRepositoryToken(User),
  useFactory: async (dataSource: DataSource): Promise<Repository<User>> =>
    dataSource.getRepository(User),
  inject: [PG_SOURCE],
};
