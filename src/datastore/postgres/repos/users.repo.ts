import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppNotFoundError } from '~/common/errors';
import { User as DBUser } from '~/datastore/postgres/entities/user.entity';
import { convertTypeOrmErrorToAppError } from '~/datastore/postgres/repos/utils';
import { CreateUserDto } from '~/users/dto/create-user.dto';
import { UserModel } from '~/users/model/user.model';
import { UsersRepo } from '~/users/repo/user.repo';

@Injectable()
export class PostgresUsersRepo implements UsersRepo {
  constructor(@InjectRepository(DBUser) private readonly usersRepo: Repository<DBUser>) {}

  public async createUser(params: CreateUserDto): Promise<UserModel> {
    const { name } = params;
    const entity = this.usersRepo.create(params);
    await this.usersRepo.save(entity).catch(convertTypeOrmErrorToAppError(name, UsersRepo.type));
    return this.toUser(entity, params.name);
  }

  public async findByName(name: string): Promise<UserModel> {
    const entity = await this.usersRepo.findOneBy({ name });
    return this.toUser(entity, name);
  }

  private toUser(user: DBUser | null, givenId: string): UserModel {
    if (!user) {
      throw new AppNotFoundError(givenId, UsersRepo.type);
    }
    const { id, name } = user;

    return new UserModel({
      id: String(id),
      name,
    });
  }
}
